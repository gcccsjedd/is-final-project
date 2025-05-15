import Ajv from "ajv";
import schema from "../routes/api/jumbohotdog-decisionagent/project.schema.json";

const ajv = new Ajv();
const validate = ajv.compile(schema);

export function validateProject(data: unknown) {
	if (!validate(data)) {
		return { valid: false, errors: validate.errors };
	}
	return { valid: true };
}
