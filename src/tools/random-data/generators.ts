import { faker } from '@faker-js/faker';

export type FieldCategory = 'Personal' | 'Contact' | 'Location' | 'Finance' | 'Commerce' | 'System' | 'Date' | 'Text' | 'Specialized';

export type FieldType =
  | 'id' | 'uuid' | 'firstName' | 'lastName' | 'fullName' | 'gender' | 'jobTitle' | 'jobArea' | 'bio' | 'prefix' | 'suffix'
  | 'company' | 'email' | 'exampleEmail' | 'userName' | 'url' | 'ipv4' | 'ipv6' | 'mac' | 'userAgent'
  | 'street' | 'streetAddress' | 'city' | 'state' | 'country' | 'zipCode' | 'latitude' | 'longitude' | 'timeZone' | 'countryCode'
  | 'amount' | 'currencyCode' | 'currencyName' | 'creditCardNumber' | 'creditCardCVV' | 'iban' | 'bic' | 'accountName'
  | 'productName' | 'productDescription' | 'productCategory' | 'productMaterial' | 'price' | 'isbn' | 'sku' | 'department'
  | 'pastDate' | 'futureDate' | 'recentDate' | 'birthdate'
  | 'fileName' | 'fileExtension' | 'mimeType' | 'fileType'
  | 'word' | 'words' | 'sentence' | 'paragraph' | 'slug'
  | 'dish' | 'cuisine' | 'ingredient'
  | 'songName' | 'musicGenre' | 'artist'
  | 'phone' | 'boolean' | 'integer' | 'float' | 'color';

export interface FieldTypeInfo {
  id: FieldType;
  label: string;
  category: FieldCategory | 'General';
}

export const FIELD_TYPES: FieldTypeInfo[] = [
  // General
  { id: 'uuid',      label: 'UUID v4', category: 'General' },
  { id: 'boolean',   label: 'Boolean', category: 'General' },
  { id: 'integer',   label: 'Integer', category: 'General' },
  { id: 'float',     label: 'Float', category: 'General' },
  { id: 'color',     label: 'Hex Color', category: 'General' },

  // Personal
  { id: 'firstName', label: 'First Name', category: 'Personal' },
  { id: 'lastName',  label: 'Last Name', category: 'Personal' },
  { id: 'fullName',  label: 'Full Name', category: 'Personal' },
  { id: 'company',   label: 'Company / Organization', category: 'Personal' },
  { id: 'gender',    label: 'Gender', category: 'Personal' },
  { id: 'jobTitle',  label: 'Job Title', category: 'Personal' },
  { id: 'jobArea',   label: 'Job Area', category: 'Personal' },
  { id: 'bio',       label: 'Short Bio', category: 'Personal' },
  { id: 'prefix',    label: 'Name Prefix', category: 'Personal' },
  { id: 'suffix',    label: 'Name Suffix', category: 'Personal' },

  // Contact
  { id: 'email',     label: 'Email', category: 'Contact' },
  { id: 'exampleEmail', label: 'Example Email', category: 'Contact' },
  { id: 'phone',     label: 'Phone Number', category: 'Contact' },
  { id: 'userName',  label: 'Username', category: 'Contact' },
  { id: 'url',       label: 'Website URL', category: 'Contact' },

  // Location
  { id: 'street',    label: 'Street Name', category: 'Location' },
  { id: 'streetAddress', label: 'Street Address', category: 'Location' },
  { id: 'city',      label: 'City', category: 'Location' },
  { id: 'state',     label: 'State', category: 'Location' },
  { id: 'country',   label: 'Country', category: 'Location' },
  { id: 'countryCode', label: 'Country Code', category: 'Location' },
  { id: 'zipCode',   label: 'ZIP / Postal Code', category: 'Location' },
  { id: 'timeZone',  label: 'Timezone', category: 'Location' },
  { id: 'latitude',  label: 'Latitude', category: 'Location' },
  { id: 'longitude', label: 'Longitude', category: 'Location' },

  // Finance
  { id: 'amount',    label: 'Amount', category: 'Finance' },
  { id: 'price',     label: 'Price', category: 'Finance' },
  { id: 'currencyCode', label: 'Currency Code', category: 'Finance' },
  { id: 'currencyName', label: 'Currency Name', category: 'Finance' },
  { id: 'creditCardNumber', label: 'Credit Card Number', category: 'Finance' },
  { id: 'creditCardCVV', label: 'Credit Card CVV', category: 'Finance' },
  { id: 'iban',      label: 'IBAN', category: 'Finance' },
  { id: 'bic',       label: 'SWIFT / BIC', category: 'Finance' },
  { id: 'accountName', label: 'Bank Account Name', category: 'Finance' },

  // Commerce
  { id: 'productName', label: 'Product Name', category: 'Commerce' },
  { id: 'productDescription', label: 'Product Description', category: 'Commerce' },
  { id: 'productCategory', label: 'Product Category', category: 'Commerce' },
  { id: 'productMaterial', label: 'Product Material', category: 'Commerce' },
  { id: 'isbn',      label: 'ISBN', category: 'Commerce' },
  { id: 'sku',       label: 'SKU', category: 'Commerce' },
  { id: 'department', label: 'Department', category: 'Commerce' },

  // Date
  { id: 'pastDate',   label: 'Past Date', category: 'Date' },
  { id: 'futureDate', label: 'Future Date', category: 'Date' },
  { id: 'recentDate', label: 'Recent Date', category: 'Date' },
  { id: 'birthdate',  label: 'Birth Date', category: 'Date' },

  // System
  { id: 'ipv4',      label: 'IPv4 Address', category: 'System' },
  { id: 'ipv6',      label: 'IPv6 Address', category: 'System' },
  { id: 'mac',       label: 'MAC Address', category: 'System' },
  { id: 'userAgent', label: 'User Agent', category: 'System' },
  { id: 'fileName',   label: 'Filename', category: 'System' },
  { id: 'fileExtension', label: 'File Extension', category: 'System' },
  { id: 'mimeType',   label: 'MIME Type', category: 'System' },
  { id: 'fileType',   label: 'File Type', category: 'System' },

  // Text
  { id: 'word',      label: 'Single Word', category: 'Text' },
  { id: 'words',     label: 'Multiple Words', category: 'Text' },
  { id: 'sentence',  label: 'Sentence', category: 'Text' },
  { id: 'paragraph', label: 'Paragraph', category: 'Text' },
  { id: 'slug',      label: 'URL Slug', category: 'Text' },

  // Specialized
  { id: 'dish',      label: 'Dish Name (Food)', category: 'Specialized' },
  { id: 'cuisine',   label: 'Cuisine (Food)', category: 'Specialized' },
  { id: 'ingredient', label: 'Ingredient (Food)', category: 'Specialized' },
  { id: 'songName',   label: 'Song Title', category: 'Specialized' },
  { id: 'musicGenre', label: 'Music Genre', category: 'Specialized' },
  { id: 'artist',     label: 'Artist Name', category: 'Specialized' },
];

export function generateValue(type: FieldType, config: Record<string, any> = {}): any {
  switch (type) {
    // General
    case 'id':
    case 'uuid':      return faker.string.uuid();
    case 'boolean':   return faker.datatype.boolean();
    case 'integer': {
      const min = config.min ?? 0, max = config.max ?? 10000;
      return faker.number.int({ min, max });
    }
    case 'float': {
      const min = config.min ?? 0, max = config.max ?? 1000, precision = config.decimals ?? 2;
      return faker.number.float({ min, max, fractionDigits: precision });
    }
    case 'color':     return faker.internet.color();

    // Personal
    case 'firstName': return faker.person.firstName();
    case 'lastName':  return faker.person.lastName();
    case 'fullName':  return faker.person.fullName();
    case 'gender':    return faker.person.gender();
    case 'jobTitle':  return faker.person.jobTitle();
    case 'jobArea':   return faker.person.jobArea();
    case 'bio':       return faker.person.bio();
    case 'prefix':    return faker.person.prefix();
    case 'suffix':    return faker.person.suffix();
    case 'company':   return faker.company.name();

    // Contact
    case 'email':     return faker.internet.email();
    case 'exampleEmail': return faker.internet.exampleEmail();
    case 'phone':     return faker.phone.number();
    case 'userName':  return faker.internet.userName();
    case 'url':       return faker.internet.url();

    // Location
    case 'street':    return faker.location.street();
    case 'streetAddress': return faker.location.streetAddress();
    case 'city':      return faker.location.city();
    case 'state':     return faker.location.state();
    case 'country':   return faker.location.country();
    case 'countryCode': return faker.location.countryCode();
    case 'zipCode':   return faker.location.zipCode();
    case 'timeZone':  return faker.location.timeZone();
    case 'latitude':  return faker.location.latitude();
    case 'longitude': return faker.location.longitude();

    // Finance
    case 'amount':    return faker.finance.amount();
    case 'price':     return faker.commerce.price();
    case 'currencyCode': return faker.finance.currencyCode();
    case 'currencyName': return faker.finance.currencyName();
    case 'creditCardNumber': return faker.finance.creditCardNumber();
    case 'creditCardCVV': return faker.finance.creditCardCVV();
    case 'iban':      return faker.finance.iban();
    case 'bic':       return faker.finance.bic();
    case 'accountName': return faker.finance.accountName();

    // Commerce
    case 'productName': return faker.commerce.productName();
    case 'productDescription': return faker.commerce.productDescription();
    case 'productCategory': return (faker.commerce as any).department?.() || faker.commerce.department();
    case 'productMaterial': return faker.commerce.productMaterial();
    case 'isbn': {
      try {
        return (faker as any).commerce?.isbn?.() || (faker as any).helpers?.replaceSymbols?.('###-##########') || faker.string.numeric(13);
      } catch {
        return faker.string.numeric(13);
      }
    }
    case 'sku':       return (faker as any).commerce?.sku?.() || faker.string.alphanumeric(8).toUpperCase();
    case 'department': return faker.commerce.department();

    // Date
    case 'pastDate':   return faker.date.past().toISOString();
    case 'futureDate': return faker.date.future().toISOString();
    case 'recentDate': return faker.date.recent().toISOString();
    case 'birthdate':  return faker.date.birthdate().toISOString().split('T')[0];

    // System
    case 'ipv4':      return faker.internet.ipv4();
    case 'ipv6':      return faker.internet.ipv6();
    case 'mac':       return faker.internet.mac();
    case 'userAgent': return faker.internet.userAgent();
    case 'fileName':   return faker.system.fileName();
    case 'fileExtension': return (faker.system as any).fileExt?.() || faker.system.fileType();
    case 'mimeType':   return faker.system.mimeType();
    case 'fileType':   return faker.system.fileType();

    // Text
    case 'word':      return faker.lorem.word();
    case 'words':     return faker.lorem.words();
    case 'sentence':  return faker.lorem.sentence();
    case 'paragraph': return faker.lorem.paragraph();
    case 'slug':      return faker.lorem.slug();

    // Specialized
    case 'dish':      return (faker as any).food?.dish?.() || faker.lorem.word();
    case 'cuisine':   return (faker as any).food?.cuisine?.() || faker.lorem.word();
    case 'ingredient': return (faker as any).food?.ingredient?.() || faker.lorem.word();
    case 'songName':   return faker.music.songName();
    case 'musicGenre': return faker.music.genre();
    case 'artist':     return faker.music.artist();

    default: return null;
  }
}

export type FieldDef = {
  id: string;
  name: string;
  type: FieldType;
  config: Record<string, any>;
  isNested?: boolean;
  nestedFields?: FieldDef[];
  isArray?: boolean;
  arrayCount?: number;
};

export function generateRecord(fields: FieldDef[]): Record<string, any> {
  const record: Record<string, any> = {};
  for (const field of fields) {
    if (field.isNested && field.nestedFields) {
      if (field.isArray) {
        record[field.name] = Array.from({ length: field.arrayCount ?? 2 }, () =>
          generateRecord(field.nestedFields!)
        );
      } else {
        record[field.name] = generateRecord(field.nestedFields!);
      }
    } else if (field.isArray) {
      record[field.name] = Array.from({ length: field.arrayCount ?? 2 }, () =>
        generateValue(field.type, field.config)
      );
    } else {
      record[field.name] = generateValue(field.type, field.config);
    }
  }
  return record;
}

export function toCSV(data: Record<string, any>[]): string {
  if (!data.length) return '';
  const flatData = data.map(r => flattenObject(r));
  const keys = Object.keys(flatData[0]);
  const header = keys.join(',');
  const rows = flatData.map(r =>
    keys.map(k => {
      const v = r[k];
      const s = v === null || v === undefined ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

function flattenObject(obj: any, prefix = ''): Record<string, any> {
  return Object.keys(obj).reduce((acc, key) => {
    const val = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(acc, flattenObject(val, fullKey));
    } else {
      acc[fullKey] = Array.isArray(val) ? JSON.stringify(val) : val;
    }
    return acc;
  }, {} as Record<string, any>);
}

export function toSQL(data: Record<string, any>[], tableName = 'records'): string {
  if (!data.length) return '';
  const flatData = data.map(r => flattenObject(r));
  const keys = Object.keys(flatData[0]);
  const colDefs = keys.map(k => `  \`${k}\` TEXT`).join(',\n');
  const createTable = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n${colDefs}\n);\n\n`;
  const inserts = flatData.map(r => {
    const vals = keys.map(k => {
      const v = r[k];
      if (v === null || v === undefined) return 'NULL';
      if (typeof v === 'boolean') return v ? '1' : '0';
      if (typeof v === 'number') return String(v);
      return `'${String(v).replace(/'/g, "''")}'`;
    }).join(', ');
    return `INSERT INTO \`${tableName}\` (${keys.map(k=>`\`${k}\``).join(', ')}) VALUES (${vals});`;
  }).join('\n');
  return createTable + inserts;
}
