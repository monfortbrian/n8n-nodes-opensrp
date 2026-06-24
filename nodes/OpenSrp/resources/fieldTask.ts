import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { extractBundleEntries, openSrpRequest } from '../shared/GenericFunctions';
import type { IFhirBundle, IFhirResource } from '../shared/types';

export const fieldTaskProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['fieldTask'] } },
		options: [
			{
				name: 'Assign Task',
				value: 'assignTask',
				description: "Push a new work order onto a frontliner's offline task list",
				action: 'Assign a field task',
			},
			{
				name: 'Monitor Status',
				value: 'monitorStatus',
				description: 'Query active tasks by status, owner, or catchment',
				action: 'Monitor field task status',
			},
		],
		default: 'assignTask',
	},
	{
		displayName: 'Task Description',
		name: 'description',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Inspect Water Pump Zone B for contamination',
		displayOptions: { show: { resource: ['fieldTask'], operation: ['assignTask'] } },
	},
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'options',
		options: [
			{ name: 'Routine', value: 'routine' },
			{ name: 'Urgent', value: 'urgent' },
			{ name: 'ASAP', value: 'asap' },
			{ name: 'STAT', value: 'stat' },
		],
		default: 'routine',
		displayOptions: { show: { resource: ['fieldTask'], operation: ['assignTask'] } },
	},
	{
		displayName: 'Assign To (Frontliner ID)',
		name: 'ownerId',
		type: 'string',
		required: true,
		default: '',
		description: 'FHIR Practitioner ID of the frontliner receiving this task',
		displayOptions: { show: { resource: ['fieldTask'], operation: ['assignTask'] } },
	},
	{
		displayName: 'Catchment ID (For)',
		name: 'forId',
		type: 'string',
		default: '',
		description: 'FHIR Location or Patient ID this task is about',
		displayOptions: { show: { resource: ['fieldTask'], operation: ['assignTask'] } },
	},
	{
		displayName: 'Catchment Type',
		name: 'forType',
		type: 'options',
		options: [
			{ name: 'Location', value: 'Location' },
			{ name: 'Patient', value: 'Patient' },
		],
		default: 'Location',
		displayOptions: { show: { resource: ['fieldTask'], operation: ['assignTask'] } },
	},
	{
		displayName: 'Due Date',
		name: 'dueDate',
		type: 'dateTime',
		default: '',
		description: 'Task deadline (ISO 8601)',
		displayOptions: { show: { resource: ['fieldTask'], operation: ['assignTask'] } },
	},
	{
		displayName: 'Filter by Status',
		name: 'status',
		type: 'options',
		options: [
			{ name: 'Requested', value: 'requested' },
			{ name: 'In Progress', value: 'in-progress' },
			{ name: 'Completed', value: 'completed' },
			{ name: 'Cancelled', value: 'cancelled' },
			{ name: 'Failed', value: 'failed' },
		],
		default: 'requested',
		displayOptions: { show: { resource: ['fieldTask'], operation: ['monitorStatus'] } },
	},
	{
		displayName: 'Frontliner ID (Owner)',
		name: 'ownerFilter',
		type: 'string',
		default: '',
		description: 'Filter tasks by assigned Practitioner ID (leave empty for all)',
		displayOptions: { show: { resource: ['fieldTask'], operation: ['monitorStatus'] } },
	},
	{
		displayName: 'Updated Since',
		name: 'lastUpdated',
		type: 'dateTime',
		default: '',
		description: 'Only return tasks updated after this date (ISO 8601)',
		displayOptions: { show: { resource: ['fieldTask'], operation: ['monitorStatus'] } },
	},
	{
		displayName: 'Max Results',
		name: 'count',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 200 },
		displayOptions: { show: { resource: ['fieldTask'], operation: ['monitorStatus'] } },
	},
];

export async function executeFieldTask(
	context: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<INodeExecutionData> {
	if (operation === 'assignTask') {
		const description = context.getNodeParameter('description', i) as string;
		const priority = context.getNodeParameter('priority', i) as string;
		const ownerId = context.getNodeParameter('ownerId', i) as string;
		const forId = context.getNodeParameter('forId', i) as string;
		const forType = context.getNodeParameter('forType', i) as string;
		const dueDate = context.getNodeParameter('dueDate', i) as string;

		const body: IFhirResource = {
			resourceType: 'Task',
			status: 'requested',
			intent: 'order',
			priority,
			description,
			owner: { reference: `Practitioner/${ownerId}` },
		};

		if (forId) {
			body['for'] = { reference: `${forType}/${forId}` };
		}

		if (dueDate) {
			body['restriction'] = { period: { end: dueDate } };
		}

		const result = await openSrpRequest(context, 'POST', '/Task', body);
		return { json: result };
	}

	if (operation === 'monitorStatus') {
		const status = context.getNodeParameter('status', i) as string;
		const ownerFilter = context.getNodeParameter('ownerFilter', i) as string;
		const lastUpdated = context.getNodeParameter('lastUpdated', i) as string;
		const count = context.getNodeParameter('count', i) as number;

		const qs: Record<string, string | number | boolean> = { status, _count: count };
		if (ownerFilter) qs['owner'] = `Practitioner/${ownerFilter}`;
		if (lastUpdated) qs['_lastUpdated'] = `gt${lastUpdated}`;

		const result = (await openSrpRequest(context, 'GET', '/Task', undefined, qs)) as IFhirBundle;
		const entries = extractBundleEntries(result);
		return { json: { total: result.total ?? entries.length, tasks: entries } };
	}

	throw new Error(`Unknown fieldTask operation: ${operation}`);
}