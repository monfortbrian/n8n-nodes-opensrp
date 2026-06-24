import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { catchmentProperties, executeCatchment } from './resources/catchment';
import { frontlinerProperties, executeFrontliner } from './resources/frontliner';
import { fieldTaskProperties, executeFieldTask } from './resources/fieldTask';

export class OpenSrp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenSRP',
		name: 'openSrp',
		icon: 'file:opensrp.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + " " + $parameter["resource"]}}',
		description: 'Interact with OpenSRP FHIR R4; assign field tasks, manage catchments, and track frontline workers',
		defaults: {
			name: 'OpenSRP',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'openSrpApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Catchment',
						value: 'catchment',
						description: 'FHIR Location; villages, water points, farms, camps',
					},
					{
						name: 'Field Task',
						value: 'fieldTask',
						description: 'FHIR Task; work orders pushed to frontliner devices',
					},
					{
						name: 'Frontliner',
						value: 'frontliner',
						description: 'FHIR Practitioner; CHWs, engineers, extension officers',
					},
				],
				default: 'fieldTask',
			},
			...catchmentProperties,
			...frontlinerProperties,
			...fieldTaskProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			let result: INodeExecutionData;

			try {
				if (resource === 'catchment') {
					result = await executeCatchment(this, operation, i);
				} else if (resource === 'frontliner') {
					result = await executeFrontliner(this, operation, i);
				} else if (resource === 'fieldTask') {
					result = await executeFieldTask(this, operation, i);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, { itemIndex: i });
				}

				returnData.push(result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: i });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}