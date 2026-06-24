import type { IExecuteFunctions, IHttpRequestOptions, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import type { IFhirBundle, IFhirResource, IOpenSrpCredentials, ITokenCache } from './types';

const tokenCache: Map<string, ITokenCache> = new Map();

async function getOAuth2Token(
	credentials: IOpenSrpCredentials,
	cacheKey: string,
): Promise<string> {
	const cached = tokenCache.get(cacheKey);
	if (cached && Date.now() < cached.expiresAt - 30_000) {
		return cached.accessToken;
	}

	const body = new URLSearchParams({
		grant_type: 'client_credentials',
		client_id: credentials.clientId ?? '',
		client_secret: credentials.clientSecret ?? '',
	});

	const response = await fetch(credentials.tokenUrl ?? '', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	});

	if (!response.ok) {
		throw new Error(`Keycloak token request failed: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as { access_token: string; expires_in: number };

	tokenCache.set(cacheKey, {
		accessToken: data.access_token,
		expiresAt: Date.now() + data.expires_in * 1000,
	});

	return data.access_token;
}

async function getAuthHeader(
	credentials: IOpenSrpCredentials,
	cacheKey: string,
): Promise<string> {
	if (credentials.authType === 'bearer') {
		return `Bearer ${credentials.bearerToken ?? ''}`;
	}
	const token = await getOAuth2Token(credentials, cacheKey);
	return `Bearer ${token}`;
}

export async function openSrpRequest(
	context: IExecuteFunctions,
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
	endpoint: string,
	body?: IFhirResource,
	qs?: Record<string, string | number | boolean>,
): Promise<IFhirResource | IFhirBundle> {
	const credentials = (await context.getCredentials('openSrpApi')) as IOpenSrpCredentials;
	const cacheKey = `${credentials.baseUrl}::${credentials.clientId ?? 'bearer'}`;
	const authHeader = await getAuthHeader(credentials, cacheKey);
	const baseUrl = credentials.baseUrl.replace(/\/$/, '');

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers: {
			Authorization: authHeader,
			'Content-Type': 'application/fhir+json',
			Accept: 'application/fhir+json',
		},
		qs,
		json: true,
	};

	if (body) {
		options.body = body;
	}

	try {
		return await context.helpers.httpRequest(options) as IFhirResource | IFhirBundle;
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject);
	}
}

export function extractBundleEntries(bundle: IFhirBundle): IFhirResource[] {
	if (!bundle.entry || bundle.entry.length === 0) return [];
	return bundle.entry.map((e) => e.resource);
}