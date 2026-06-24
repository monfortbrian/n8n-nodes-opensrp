import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { openSrpRequest } from '../shared/GenericFunctions';
import type { IFhirResource } from '../shared/types';

export const catchmentProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['catchment'] } },
		options: [
			{
				name: 'Register Asset',
				value: 'registerAsset',
				description: 'Register a new catchment location or physical asset',
				action: 'Register a catchment asset',
			},
			{
				name: 'Get Status',
				value: 'getStatus',
				description: 'Retrieve the current status of a catchment asset by ID',
				action: 'Get catchment status',
			},
		],
		default: 'registerAsset',
	},
	{
		displayName: 'Asset Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Borehole Pump, Village Musanze North',
		description: 'Human-readable name of the catchment asset',
		displayOptions: { show: { resource: ['catchment'], operation: ['registerAsset'] } },
	},
	{
		displayName: 'Asset Type',
		name: 'assetType',
		type: 'options',
		options: [
			{ name: 'Water Point', value: 'Water Point' },
			{ name: 'Village', value: 'Village' },
			{ name: 'Farming Cooperative', value: 'Farming Cooperative' },
			{ name: 'Refugee Camp', value: 'Refugee Camp' },
			{ name: 'Dispensary', value: 'Dispensary' },
			{ name: 'Other', value: 'Other' },
		],
		default: 'Water Point',
		displayOptions: { show: { resource: ['catchment'], operation: ['registerAsset'] } },
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		placeholder: 'Community water point serving 340 households',
		displayOptions: { show: { resource: ['catchment'], operation: ['registerAsset'] } },
	},
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		typeOptions: { numberPrecision: 6 },
		default: 0,
		displayOptions: { show: { resource: ['catchment'], operation: ['registerAsset'] } },
	},
	{
		displayName: 'Longitude',
		name: 'longitude',
		type: 'number',
		typeOptions: { numberPrecision: 6 },
		default: 0,
		displayOptions: { show: { resource: ['catchment'], operation: ['registerAsset'] } },
	},
	{
		displayName: 'Catchment ID',
		name: 'catchmentId',
		type: 'string',
		required: true,
		default: '',
		description: 'FHIR Location resource ID',
		displayOptions: { show: { resource: ['catchment'], operation: ['getStatus'] } },
	},
];

export async function executeCatchment(
	context: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData> {
	if (operation === 'registerAsset') {
		const name = context.getNodeParameter('name', i) as string;
		const assetType = context.getNodeParameter('assetType', i) as string;
		const description = context.getNodeParameter('description', i) as string;
		const latitude = context.getNodeParameter('latitude', i) as number;
		const longitude = context.getNodeParameter('longitude', i) as number;

		const body: IFhirResource = {
			resourceType: 'Location',
			status: 'active',
			name,
			description,
			type: [{ text: assetType }],
			position: { latitude, longitude },
		};

		const result = await openSrpRequest(context, 'POST', '/Location', body);
		return { json: result };
	}

	if (operation === 'getStatus') {
		const catchmentId = context.getNodeParameter('catchmentId', i) as string;
		const result = await openSrpRequest(context, 'GET', `/Location/${catchmentId}`);
		return { json: result };
	}

	throw new Error(`Unknown catchment operation: ${operation}`);
}