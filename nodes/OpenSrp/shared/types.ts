import type { IDataObject } from 'n8n-workflow';

export interface IOpenSrpCredentials {
	authType: 'oauth2' | 'bearer';
	baseUrl: string;
	tokenUrl?: string;
	clientId?: string;
	clientSecret?: string;
	bearerToken?: string;
}

export interface IFhirResource extends IDataObject {
	resourceType: string;
	id?: string;
}

export interface IFhirBundle extends IDataObject {
	resourceType: 'Bundle';
	total?: number;
	entry?: Array<{ resource: IFhirResource }>;
}

export interface IFhirOperationOutcome extends IDataObject {
	resourceType: 'OperationOutcome';
	issue: Array<{
		severity: string;
		code: string;
		diagnostics?: string;
	}>;
}

export interface ITokenCache {
	accessToken: string;
	expiresAt: number;
}