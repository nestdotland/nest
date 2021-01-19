export interface Meta {
  $schema?: string;

  name: string;
  fullName?: string;
  description?: string;
  homepage?: string;
  license?: string;

  unlisted?: boolean;
  private?: boolean;
}
