import { useAuthRequest, makeRedirectUri } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

// Spotify OAuth Configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

const SCOPES = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative',
];

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export class SpotifyAuthService {
    private static instance: SpotifyAuthService;
    private tokens: AuthTokens | null = null;

    private constructor() {}

    static getInstance(): SpotifyAuthService {
        if (!SpotifyAuthService.instance) {
            SpotifyAuthService.instance = new SpotifyAuthService();
        }
        return SpotifyAuthService.instance;
    }

    /**
     * Initiates the Spotify OAuth flow
     * Opens browser for user to authorize
     */
    async authenticate(): Promise<boolean> {
        try {
            // Create redirect URI based on platform
            const redirectUri = makeRedirectUri({
                scheme: 'entheosnow',
                path: 'spotify/callback',
            });

            console.log('Redirect URI:', redirectUri);

            // Generate random state for CSRF protection
            const state = this.generateRandomString(16);

            // Build authorization URL
            const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?${new URLSearchParams({
                client_id: SPOTIFY_CLIENT_ID,
                response_type: 'code',
                redirect_uri: redirectUri,
                state: state,
                scope: SCOPES.join(' '),
            })}`;

            // Open Spotify authorization page
            const result = await AuthSession.openAuthSessionAsync(authUrl, redirectUri);

            if (result.type !== 'success') {
                console.log('Auth cancelled or failed:', result.type);
                return false;
            }

            // Verify state matches (CSRF protection)
            if (result.params.state !== state) {
                console.error('State mismatch - possible CSRF attack');
                return false;
            }

            // Exchange authorization code for tokens
            const tokens = await this.exchangeCodeForTokens(
                result.params.code,
                redirectUri
            );

            // Store tokens
            await this.storeTokens(tokens);
            this.tokens = tokens;

            return true;
        } catch (error) {
            console.error('Authentication error:', error);
            return false;
        }
    }

    /**
     * Exchanges authorization code for access + refresh tokens
     */
    private async exchangeCodeForTokens(
        code: string,
        redirectUri: string
    ): Promise<AuthTokens> {
        const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                client_id: SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Token exchange failed: ${error}`);
        }

        const data = await response.json();

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: Date.now() + data.expires_in * 1000,
        };
    }

    /**
     * Stores tokens securely on device
     */
    private async storeTokens(tokens: AuthTokens): Promise<void> {
        await SecureStore.setItemAsync('spotify_tokens', JSON.stringify(tokens));
    }

    /**
     * Loads tokens from secure storage
     */
    private async loadTokens(): Promise<AuthTokens | null> {
        const stored = await SecureStore.getItemAsync('spotify_tokens');
        return stored ? JSON.parse(stored) : null;
    }

    /**
     * Generates random string for state parameter
     */
    private generateRandomString(length: number): string {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], '');
    }

    /**
     * Gets current access token, refreshing if expired
     */
    async getAccessToken(): Promise<string | null> {
        if (!this.tokens) {
            this.tokens = await this.loadTokens();
        }

        if (!this.tokens) {
            return null;
        }

        // Check if token is expired (with 5 min buffer)
        if (Date.now() >= this.tokens.expiresAt - 5 * 60 * 1000) {
            await this.refreshAccessToken();
        }

        return this.tokens?.accessToken || null;
    }

    /**
     * Refreshes expired access token using refresh token
     */
    private async refreshAccessToken(): Promise<void> {
        if (!this.tokens?.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.tokens.refreshToken,
                client_id: SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
            }),
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();

        this.tokens = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || this.tokens.refreshToken,
            expiresAt: Date.now() + data.expires_in * 1000,
        };

        await this.storeTokens(this.tokens);
    }

    /**
     * Checks if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const token = await this.getAccessToken();
        return token !== null;
    }

    /**
     * Clears tokens (logout)
     */
    async logout(): Promise<void> {
        await SecureStore.deleteItemAsync('spotify_tokens');
        this.tokens = null;
    }
}


