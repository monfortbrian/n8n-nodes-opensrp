import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class OpenSrpApi implements ICredentialType {
	name = 'openSrpApi';
	displayName = 'OpenSRP API';
	icon = 'file:opensrp.svg' as const;
	documentationUrl = 'https://smartregister.org';
	test = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/metadata',
		},
	};
	properties: INodeProperties[] = [
		{
			displayName: 'Authentication',
			name: 'authType',
			type: 'options',
			options: [
				{ name: 'OAuth2, Keycloak (Production)', value: 'oauth2' },
				{ name: 'Bearer Token (Local / Dev)', value: 'bearer' },
			],
			default: 'oauth2',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://opensrp.example.org/fhir',
			description: 'Your OpenSRP FHIR server base URL no trailing slash',
			required: true,
		},
		{
			displayName: 'Keycloak Token URL',
			name: 'tokenUrl',
			type: 'string',
			default: '',
			placeholder: 'https://keycloak.example.org/auth/realms/opensrp/protocol/openid-connect/token',
			description: 'Full Keycloak token URL for OAuth2 Client Credentials flow',
			displayOptions: { show: { authType: ['oauth2'] } },
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			displayOptions: { show: { authType: ['oauth2'] } },
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			displayOptions: { show: { authType: ['oauth2'] } },
		},
		{
			displayName: 'Bearer Token',
			name: 'bearerToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Static bearer token for local development instances',
			displayOptions: { show: { authType: ['bearer'] } },
		},
	];
}