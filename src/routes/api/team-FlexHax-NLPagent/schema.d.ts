declare module './schema.json' {
  const schema: {
    $schema: string;
    title: string;
    description: string;
    type: string;
    required: string[];
    properties: {
      text: {
        type: string;
        description: string;
        minLength: number;
        maxLength: number;
      };
      task: {
        type: string;
        description: string;
        enum: string[];
      };
      options: {
        type: string;
        description: string;
        properties: {
          maxLength: {
            type: string;
            description: string;
            minimum: number;
            maximum: number;
          };
          minLength: {
            type: string;
            description: string;
            minimum: number;
            maximum: number;
          };
        };
      };
    };
  };
  export default schema;
} 