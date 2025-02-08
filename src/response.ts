export class JsonResponse extends Response {
	public constructor(body?: BodyInit | null, init?: ResponseInit) {
		super(JSON.stringify(body), {
			...init,
			headers: {
				'content-type': 'application/json',
			},
		});
	}
}
