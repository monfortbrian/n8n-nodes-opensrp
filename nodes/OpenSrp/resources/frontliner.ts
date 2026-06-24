import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { extractBundleEntries, openSrpRequest } from '../shared/GenericFunctions';
import type { IFhirBundle } from '../shared/types';

export const frontlinerProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['frontliner'] } },
		options: [
			{
				name: 'Get Lineup',
				value: 'getLineup',
				description: 'Retrieve all active frontline workers in a location',
				action: 'Get frontliner lineup',
			},
			{
				name: 'Track Performance',
				value: 'trackPerformance',
				description: 'Get task completion metrics for a specific frontliner',
				action: 'Track frontliner performance',
			},
		],
		default: 'getLineup',
	},
	// Get Lineup fields
	{
		displayName: 'Location ID',
		name: 'locationId',
		type: 'string',
		default: '',
		description: 'Filter frontliners by catchment Location ID (leave empty for all)',
		displayOptions: { show: { resource: ['frontliner'], operation: ['getLineup'] } },
	},
	{
		displayName: 'Max Results',
		name: 'count',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 200 },
		displayOptions: { show: { resource: ['frontliner'], operation: ['getLineup'] } },
	},
	// Track Performance fields
	{
		displayName: 'Frontliner ID',
		name: 'frontlinerId',
		type: 'string',
		required: true,
		default: '',
		description: 'FHIR Practitioner resource ID',
		displayOptions: { show: { resource: ['frontliner'], operation: ['trackPerformance'] } },
	},
	{
		displayName: 'From Date',
		name: 'fromDate',
		type: 'dateTime',
		default: '',
		description: 'Start of the performance window (ISO 8601)',
		displayOptions: { show: { resource: ['frontliner'], operation: ['trackPerformance'] } },
	},
];

export async function executeFrontliner(
	context: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData> {
	if (operation === 'getLineup') {
		const locationId = context.getNodeParameter('locationId', i) as string;
		const count = context.getNodeParameter('count', i) as number;

		const qs: Record<string, string | number | boolean> = { _count: count };
		if (locationId) qs['location'] = locationId;

		const result = (await openSrpRequest(context, 'GET', '/Practitioner', undefined, qs)) as IFhirBundle;
		const entries = extractBundleEntries(result);
		return { json: { total: result.total ?? entries.length, frontliners: entries } };
	}

	if (operation === 'trackPerformance') {
		const frontlinerId = context.getNodeParameter('frontlinerId', i) as string;
		const fromDate = context.getNodeParameter('fromDate', i) as string;

		const qs: Record<string, string | number | boolean> = {
			owner: `Practitioner/${frontlinerId}`,
			status: 'completed',
			_count: 200,
		};
		if (fromDate) qs['_lastUpdated'] = `gt${fromDate}`;

		const result = (await openSrpRequest(context, 'GET', '/Task', undefined, qs)) as IFhirBundle;
		const entries = extractBundleEntries(result);
		return {
			json: {
				frontlinerId,
				completedTasks: entries.length,
				tasks: entries,
			},
		};
	}

	throw new Error(`Unknown frontliner operation: ${operation}`);
}