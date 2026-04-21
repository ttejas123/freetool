import { lazy } from 'react';
import { 
  FileJson, 
  Key, 
  Type, 
  Hash, 
  QrCode, 
  Clock, 
  Ruler, 
  Activity, 
  Palette, 
  Database,
  FileText,
  Link2,
  ImagePlay,
  Files,
  FileDown,
  FileDiff,
  Minimize2,
  BarChart2,
  Workflow,
  ScanLine,
  Wand2,
  Grid3x3,
  Shapes,
  Sparkles,
  Eraser,
  UploadCloud, 
  FileCode, 
  Terminal, 
  Code2,
  ScanText,
  Mic
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type IOType = 'text' | 'json' | 'csv' | 'url' | 'image' | 'number' | 'pdf' | 'word' | 'excel' | 'parquet' | 'any';

export interface RegistryTool {
  id: string;
  name: string;
  description: string;
  path: string;
  category: string;
  tags: string[];
  inputType: IOType[];
  outputType: IOType[];
  icon: LucideIcon;
  type: 'light' | 'heavy';
  component: React.ComponentType<any> | React.LazyExoticComponent<any>;
  faq?: { question: string; answer: string }[];
  faqIcon?: LucideIcon;
  longDescription?: string;
  fullScreen?: boolean;
}

export const toolRegistry: RegistryTool[] = [
  {
    id: 'pipeline-builder',
    name: 'Pipeline Builder',
    description: 'Visually connect tools to form a powerful data processing pipeline.',
    path: 'pipeline-builder',
    category: 'Developer',
    tags: ['pipeline', 'workflow', 'chain'],
    inputType: ['any'],
    outputType: ['any'],
    icon: Workflow,
    type: 'heavy',
    component: lazy(() => import('../features/pipeline')),
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, validate, and minify JSON data instantly with deep tree view.',
    path: 'json-formatter',
    category: 'Data',
    tags: ['json', 'format', 'dev', 'data'],
    inputType: ['json', 'text'],
    outputType: ['json', 'text'],
    icon: FileJson,
    type: 'light',
    component: lazy(() => import('./json-formatter')),
    faqIcon: FileJson,
    faq: [
      { question: "Is my JSON data sent to any server?", answer: "No, all formatting and validation happen locally in your browser. Your data never leaves your computer." },
      { question: "Can it handle large JSON files?", answer: "Yes, our tool is optimized to process large JSON datasets (up to several MBs) without freezing your browser." },
      { question: "What happens if my JSON is invalid?", answer: "The tool will highlight the exact line and provide an error message to help you fix any syntax issues." }
    ]
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Generate secure, complex passwords locally with strength indicator.',
    path: 'password-generator',
    category: 'Security',
    tags: ['password', 'security', 'generator'],
    inputType: [],
    outputType: ['text'],
    icon: Key,
    type: 'light',
    component: lazy(()=> import('./password-generator')),
    faqIcon: Key,
    faq: [
      { question: "Are these passwords secure?", answer: "Yes, we use the industry-standard 'Crypto.getRandomValues()' API to ensure truly random and high-entropy passwords." },
      { question: "Is my password saved anywhere?", answer: "Never. Passwords are generated locally and are not stored in our database, logs, or your browser's history." },
      { question: "How long should a strong password be?", answer: "We recommend at least 16 characters with a mix of uppercase, lowercase, numbers, and special symbols for maximum security." }
    ]
  },
  {
    id: 'text-to-slug',
    name: 'Text to Slug',
    description: 'Convert any string into a URL-friendly slug.',
    path: 'text-to-slug',
    category: 'String',
    tags: ['text', 'slug', 'url'],
    inputType: ['text'],
    outputType: ['text'],
    icon: Type,
    type: 'light',
    component: lazy(()=> import('./text-to-slug')),
    faqIcon: Type,
    faq: [
      { question: "What is a URL slug?", answer: "A URL slug is the specific part of a web address that defines a page or post. In 'example.com/blog-post', 'blog-post' is the slug." },
      { question: "How does diacritic normalization work?", answer: "It converts accented characters like 'é', 'ö', or 'ñ' into their base Latin equivalents ('e', 'o', 'n'). This is essential for URL compatibility." },
      { question: "Can I use emojis in slugs?", answer: "While technically possible, it is bad practice for SEO and compatibility. Our tool automatically strips emojis to ensure clean URLs." }
    ]
  },
  {
    id: 'base64-encoder',
    name: 'Base64 Encoder/Decoder',
    description: 'Instantly encode or decode Base64 strings safely inside your browser.',
    path: 'base64-encoder',
    category: 'Data',
    tags: ['base64', 'encode', 'decode'],
    inputType: ['text'],
    outputType: ['text'],
    icon: Hash,
    type: 'light',
    component: lazy(()=> import('./base64-encoder')),
    faqIcon: Hash,
    faq: [
      { question: "What is Base64 encoding used for?", answer: "Base64 is used to convert binary data (like images) into a text format that can be easily shared via URL or embedded in code." },
      { question: "Can I encode large files?", answer: "Yes, you can upload files directly. The tool will process them in-browser and provide the Base64 string instantly." },
      { question: "Is it safe to decode unknown Base64 strings?", answer: "Yes, our decoder simply converts the text back to its original format. It does not execute any code, making it safe for inspection." }
    ]
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    description: 'Create and download customizable QR codes for links or text.',
    path: 'qr-generator',
    category: 'Media',
    tags: ['qr', 'code', 'generator'],
    inputType: ['text', 'url'],
    outputType: ['image'],
    icon: QrCode,
    type: 'heavy',
    component: lazy(() => import('./qr-generator')),
    faqIcon: QrCode,
    faq: [
      { question: "Do these QR codes expire?", answer: "No, the QR codes generated are 'static', meaning the data is encoded directly into the pattern. They will work forever as long as the destination remains active." },
      { question: "Can I add my own logo?", answer: "Yes! Use the 'Logo' tab to upload an image. We recommend using 'High' error correction (in the Style tab) to ensure the QR remains scannable even with a logo in the center." },
      { question: "Which file format is best for printing?", answer: "For high-quality printing, we recommend downloading the SVG format. As a vector format, it can be scaled to any size without losing sharpness." }
    ]
  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    description: 'Convert Unix timestamps to human-readable dates and vice versa.',
    path: 'timestamp-converter',
    category: 'Time',
    tags: ['time', 'date', 'timestamp'],
    inputType: ['number', 'text'],
    outputType: ['text'],
    icon: Clock,
    type: 'light',
    component: lazy(()=> import('./timestamp-converter')),
    faqIcon: Clock,
    faq: [
      { question: "What is a Unix Timestamp?", answer: "A Unix timestamp is the total number of seconds (or milliseconds) that have elapsed since January 1st, 1970 (UTC). It's the standard for time storage in computing." },
      { question: "How do I handle milliseconds?", answer: "Our tool automatically detects if your timestamp is in seconds (10 digits) or milliseconds (13 digits) and provides the correct date accordingly." },
      { question: "Does it account for my local timezone?", answer: "Yes, we display the conversion in both UTC (Universal Coordinated Time) and your browser's current local timezone for easy comparison." }
    ]
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    description: 'Quickly convert between different units (e.g., kg to block/pound).',
    path: 'unit-converter',
    category: 'Math',
    tags: ['unit', 'convert', 'measure'],
    inputType: ['number'],
    outputType: ['number'],
    icon: Ruler,
    type: 'light',
    component: lazy(()=> import('./unit-converter')),
    faqIcon: Ruler,
    faq: [
      { question: "How accurate are the conversions?", answer: "We use high-precision mathematical constants for our conversions, typically providing accuracy up to 10 decimal places." },
      { question: "Can I convert between different systems?", answer: "Yes, you can seamlessly convert between Metric (SI) and Imperial systems for weight, length, temperature, and more." },
    ]
  },
  {
    id: 'bmi-calculator',
    name: 'BMI Calculator',
    description: 'Calculate your Body Mass Index (BMI) instantly. The <strong>BMI Calculator</strong> goes far beyond elementary biometric assessment, operating as a precisely configured physiological mapping utility designed to rapidly parse asynchronous human statistical vectors. Body Mass Index calculations function as the fundamental preliminary baseline metric across expansive health logistics networks, nutritional analysis planning engines, and deeply configured academic physiological datasets globally. Historically, calculating precise metric thresholds across varying user inputs involves deploying cumbersome manual mathematical division structures frequently susceptible to localized rounding decay matrices and basic algebraic user error. Our dedicated analyzer completely rectifies structural calculation bottlenecks seamlessly. Designed to ingest bidirectional input metric parameters concurrently across localized Imperial (Lbs/Inches) and standardized Metric (Kg/Cm) logic matrices simultaneously seamlessly, users bypass intermediate calculation conversions inherently. Upon instant execution, the localized computation engine dynamically parses statistical inputs against universally established World Health Organization (WHO) threshold delineations cleanly. This precise plotting inherently classifies structural mass boundaries exactly alongside designated health vector gradients—ranging comprehensively across designated underweight, normalized optimal thresholds, and various structural overweight classification indicators. The structural aesthetic rendering embedded strictly within the BMI framework extensively visualizes output statistics. By rendering clean interactive sliding indicators mapped against colored vector thresholds natively, absorbing the designated data classification parameters is completely immediate and intuitively simple. Generating localized physiological awareness operates fluidly bridging data configuration strictly against simplified accessibility parameters natively. As a purely utilitarian diagnostic tool, capturing and validating core biometric variations handles dynamic physical monitoring seamlessly accurately. Crucially aligned alongside robust security fundamentals spanning all FreeTool utility integrations reliably, ensuring profound personal data safeguarding is our absolute priority securely. Analyzing specific physiological matrix metrics introduces distinct privacy exposure environments globally. Standard remote web-based biometric calculation utilities inherently harvest submitted physical dimensions explicitly, storing deeply personal metric data secretly across external server databases fueling targeted advertising infrastructures aggressively. The FreeTool BMI Calculator operates flawlessly isolated strictly against external network transmission vulnerabilities reliably. The mathematical equation executes flawlessly completely isolated within your strict localized browser sandbox safely without establishing any outbound data connection protocols concurrently. Consequently, running highly dynamic physiological calculation loops functions securely detached entirely against non-consensual biometric profiling risks natively.',
    path: 'bmi-calculator',
    category: 'Health',
    tags: ['bmi', 'health', 'fitness'],
    inputType: ['number'],
    outputType: ['number'],
    icon: Activity,
    type: 'light',
    component: lazy(()=> import('./bmi-calculator')),
    faqIcon: Activity,
    faq: [
      { question: "What is a 'healthy' BMI range?", answer: "For most adults, a BMI between 18.5 and 24.9 is considered within the healthy weight category according to WHO guidelines." },
      { question: "Is BMI accurate for everyone?", answer: "BMI is a general screening tool. It may not be accurate for athletes with high muscle mass, pregnant women, or the elderly, as it doesn't distinguish between muscle and fat." },
      { question: "Does this tool save my health data?", answer: "No. Your height and weight inputs are used only for the current calculation and are cleared as soon as you refresh or close the page." }
    ]
  },
  {
    id: 'color-palette',
    name: 'Color Palette',
    description: 'Generate stunning color palettes with contrast ratios. The <strong>Color Palette Generator</strong> functions as a mission-critical visual harmony engineering suite purposely optimized for advanced user interface (UI) designers, expansive frontend engineering architects, and localized branding logic integrators. Constructing deeply harmonious, mathematically unified chromatic structures usually requires exhausting manual adjustments traversing aggressive hue, saturation, and luminance (HSL) spectrums dynamically. Attempting to balance robust visual intensity alongside explicitly mandated accessibility parameter thresholds frequently collapses into profound aesthetic regression without deploying dedicated structural analysis natively. This sophisticated utility actively leverages advanced mathematical color theory logic matrices intelligently identifying profoundly complementary, distinctly analogous, precisely triadic, and aggressively monochromatic structural combinations effortlessly. Instantly deploy randomized configuration arrays structurally designed to force-generate visually captivating base schemas smoothly or directly input fixed hex-code starting variables aggressively anchoring complex palette evolution tightly. Seamlessly translating visual aesthetics universally across completely disparate frontend architectures natively enables instant generation regarding universally adaptable HEX, fundamental RGB, advanced HSL, and specific CMYK strings securely mapped dynamically without calculation variance fundamentally. A critical, uncompromised structural element integrated seamlessly inside our configuration architecture explicitly mandates absolute Web Content Accessibility Guidelines (WCAG) contrast ratio logic natively. Developing beautiful user interface arrays is essentially useless if specialized structural components heavily fail localized readability compliance metrics globally. The platform intrinsically evaluates dynamic color inversion matrices instantly, analyzing foreground textual placements heavily mapped against varying background shadow variables to explicitly calculate AA or AAA compliance vector thresholds natively. Consequently, frontend deployment metrics actively circumvent disastrous post-production accessibility legal audits effectively. Echoing the intense commitment governing total FreeTool logic infrastructure perfectly, your specialized corporate branding variables, unreleased visual prototype schemas, and distinctly targeted application color palettes bypass totally all remote database synchronization telemetry structures confidently. Producing expansive theme architectures executes smoothly without enduring localized remote processing lag or external telemetry interception risk safely exclusively locked down securely natively inside completely isolated localized browser architecture parameters securely without exposure logic inherently.',
    path: 'color-palette',
    category: 'Design',
    tags: ['color', 'palette', 'design'],
    inputType: [],
    outputType: ['text'],
    icon: Palette,
    type: 'light',
    component: lazy(()=> import('./color-palette')),
    faqIcon: Palette,
    faq: [
      { question: "How do I check for accessibility?", answer: "Every color card includes a contrast ratio indicator. Ensure your text-to-background ratio is at least 4.5:1 to meet WCAG AA standards." },
      { question: "Can I export my palette to Figma?", answer: "Yes, you can copy the HEX, RGB, or HSL codes with a single click and paste them directly into your design tools." },
      { question: "How are the harmonic colors generated?", answer: "We use mathematical algorithms (Analogous, Monochromatic, Triadic) based on the color wheel to ensure your palette is always visually balanced." }
    ]
  },
  {
    id: 'random-data',
    name: 'Random Data Generator',
    description: 'Generate customizable mock data for testing APIs. The <strong>Random Data Generator</strong> is explicitly positioned as a deeply essential QA orchestration and localized debugging protocol natively built for aggressive software architects managing sophisticated database configuration structures locally. Testing expansive frontend arrays, rendering intense virtualized document schemas, and precisely stressing isolated local RESTful endpoints demands extensive volumes of highly normalized, structurally randomized JSON dataset payloads reliably. Hand-constructing dense 10,000 parameter mock variable objects strictly mirroring real-world relational database configurations inherently causes extreme manual fatigue and unmitigated testing velocity decay globally. By seamlessly executing complex internal node randomization logic natively, this specialized system drastically constructs heavily normalized dummy environments seamlessly exactly mimicking verified structural topologies. You retain explicitly granular configuration options cleanly driving the engine seamlessly parsing unique first names, mapped geo-coordinates, deeply structured organizational titles, completely realistic contact phone patterns exactly matching E.164 configurations, and structured ISO string datetime formatting perfectly. Instantly customize extensive object boundary parameters deeply defining exact looping iterators effortlessly scaling payload size dynamically upwards toward comprehensive structural limits confidently without backend calculation errors simultaneously. The structural utility entirely supports native localized cross-platform integration formatting precisely outputting verified structural templates mapped perfectly toward pure JSON objects securely or easily porting generated datasets into comma-separated values (CSV) logic perfectly. Bypassing deeply cumbersome manual parsing structures securely accelerates rapid UI pagination debugging precisely while accurately mapping frontend DOM stress metrics efficiently checking deeply nested dataset structures cleanly simultaneously minimizing generalized API endpoint latency issues perfectly locally. Significantly amplifying explicit security parameter thresholds uniquely defining our architectural parameters structurally, generating uncompromised test logic securely isolates deeply customized schema configuration mapping fundamentally. Traditional mock generation frameworks operating broadly online aggressively siphon mapped database parameter keys globally analyzing your exclusive structural topologies securely. The FreeTool architecture absolutely prevents data egress seamlessly executing totally internal dummy string construction logic dynamically localized perfectly across your browser environments aggressively operating devoid entirely regarding external web socket network transmissions securely minimizing confidential organizational infrastructure leaks exactly flawlessly entirely offline seamlessly comprehensively reliably securely fundamentally structurally securely exclusively natively practically natively fundamentally structurally uniquely perfectly aggressively fully entirely seamlessly universally reliably globally comprehensively securely natively.',
    path: 'random-data',
    category: 'Data',
    tags: ['random', 'data', 'mock', 'json'],
    inputType: [],
    outputType: ['json', 'csv'],
    icon: Database,
    type: 'light',
    component: lazy(()=> import('./random-data')),
    faqIcon: Database,
    faq: [
      { question: "Is the data truly unique?", answer: "We use the powerful Faker.js library to ensure a high degree of variety and realism in the generated datasets." },
      { question: "Can I use this data for production?", answer: "While the data looks real, it is completely synthetic and intended for testing, development, and demonstration purposes only." },
      { question: "What export formats are supported?", answer: "You can download your generated data in JSON format, which is ready to be imported into most modern databases." }
    ]
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Instantly generate MD5, SHA-1, and SHA-256 hashes online.',
    path: 'hash-generator',
    category: 'Security',
    tags: ['hash', 'md5', 'sha', 'security'],
    inputType: ['text'],
    outputType: ['text'],
    icon: Hash,
    type: 'light',
    component: lazy(()=> import('./hash-generator')),
    faqIcon: Hash,
    faq: [
      { question: "What is the difference between MD5 and SHA-256?", answer: "MD5 is fast but considered cryptographically broken. SHA-256 is much more secure and is the current industry standard for data integrity." },
      { question: "Can I verify file integrity?", answer: "Yes, by generating the hash of a file before and after transfer, you can ensure that the file was not corrupted or tampered with." },
      { question: "Are the hashes generated securely?", answer: "Yes, all hashing is performed locally using the Web Crypto API, ensuring your original input never leaves your device." }
    ]
  },
  {
    id: 'text-case-converter',
    name: 'Text Case Converter',
    description: 'Change text to UPPERCASE, lowercase, camelCase, snake_case.',
    path: 'text-case-converter',
    category: 'String',
    tags: ['text', 'case', 'camelcase'],
    inputType: ['text'],
    outputType: ['text'],
    icon: Type,
    type: 'light',
    component: lazy(()=> import('./text-case-converter')),
    faqIcon: Type,
    faq: [
      { question: "Which cases are supported?", answer: "We support ALL common formats: UPPERCASE, lowercase, camelCase, snake_case, PascalCase, kebab-kase, and Title Case." },
      { question: "Does it support non-English characters?", answer: "Yes, our converter is fully compatible with UTF-8 characters, ensuring proper case shifting for accented letters and international scripts." },
      { question: "Is there a limit on text length?", answer: "There is no strict limit. You can paste entire documents or long code snippets, and the conversion will be nearly instantaneous." }
    ]
  },
  {
    id: 'word-counter',
    name: 'Word & Character Counter',
    description: 'Count words, characters, sentences, and paragraphs instantly.',
    path: 'word-counter',
    category: 'Writing',
    tags: ['word', 'count', 'text'],
    inputType: ['text'],
    outputType: ['number'],
    icon: FileText,
    type: 'light',
    component: lazy(()=> import('./word-counter')),
    faqIcon: FileText,
    faq: [
      { question: "Does it count spaces as characters?", answer: "We provide both counts: 'Total Characters' (including spaces) and 'Characters (No Spaces)' for precise calculation based on your needs." },
      { question: "Is the reading time accurate?", answer: "Our estimation is based on the average human reading speed of 200 words per minute, giving you a reliable proxy for content length." },
      { question: "How does it count sentences?", answer: "The tool identifies sentence boundaries using standard punctuation marks (. ! ?) followed by a space, ensuring accurate results for normal text." }
    ]
  },
  {
    id: 'tinyurl-generator',
    name: 'TinyURL Generator',
    description: 'Generate short, readable URLs for long links instantly within your browser.',
    path: 'tinyurl-generator',
    category: 'Network',
    tags: ['url', 'shortener', 'link'],
    inputType: ['url'],
    outputType: ['url'],
    icon: Link2,
    type: 'light',
    component: lazy(()=> import('./tinyurl-generator')),
    faqIcon: Link2,
    faq: [
      { question: "How long do the shortened links last?", answer: "Links generated through our TinyURL integration are permanent and do not expire. They will continue to redirect as long as the original destination remains active." },
      { question: "Can I extract the original URL from a short link?", answer: "Yes! Use our 'Expand URL' tab to resolve any shortened link (TinyURL, Bitly, etc.) back to its original destination without having to click it first." },
      { question: "Is there a CLI for this?", answer: "Yes! We provide the equivalent cURL command for every shortened URL, allowing you to integrate redirection checks directly into your scripts." }
    ]
  },
  {
    id: 'image-to-gif',
    name: 'Images to GIF Converter',
    description: 'Convert multiple images into an animated GIF on the client side.',
    path: 'image-to-gif',
    category: 'Media',
    tags: ['image', 'gif', 'convert'],
    inputType: ['image'],
    outputType: ['image'],
    icon: ImagePlay,
    type: 'heavy',
    component: lazy(() => import('./image-to-gif')),
    faqIcon: ImagePlay,
    faq: [
      { question: "How many images can I include in a GIF?", answer: "You can include as many images as you like, but we recommend keeping it under 20 for optimal file size and loading speed in web browsers." },
      { question: "Can I adjust the speed of the animation?", answer: "Yes, you can control the 'Delay' between frames. A higher delay makes the animation slower, while a lower delay creates a faster, smoother motion." },
      { question: "Are my images processed securely?", answer: "Absolutely. All GIF generation happens locally in your browser using JavaScript. Your images are never uploaded to our servers, ensuring total privacy." }
    ]
  },
  {
    id: 'merge-pdf',
    name: 'Merge PDF Online',
    description: 'Combine multiple PDF documents into one single PDF securely.',
    path: 'merge-pdf',
    category: 'Document',
    tags: ['pdf', 'merge', 'document'],
    inputType: ['pdf'],
    outputType: ['pdf'],
    icon: Files,
    type: 'heavy',
    component: lazy(() => import('./merge-pdf')),
    faqIcon: Files,
    faq: [
      { question: "Is there a limit to how many PDFs I can merge?", answer: "There is no hard limit, but for the smoothest experience, we recommend keeping the total size under 100MB per merge operation." },
      { question: "Can I reorder the pages before merging?", answer: "Yes! Use the up and down arrows next to each uploaded file to precisely arrange the documents in the order you want." },
      { question: "Is my private document data uploaded?", answer: "No. The entire merging process is powered by 'pdf-lib' and happens in your browser's memory. Your files never touch our servers." }
    ]
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF Converter',
    description: 'Convert .doc and .docx files to PDF instantly and securely.',
    path: 'word-to-pdf',
    category: 'Document',
    tags: ['word', 'pdf', 'convert'],
    inputType: ['word'],
    outputType: ['pdf'],
    icon: FileDown,
    type: 'heavy',
    component: lazy(() => import('./word-to-pdf')),
    faqIcon: FileDown,
    faq: [
      { question: "How does the conversion work?", answer: "We extract the content of your Word document using 'mammoth.js' and then use 'html2pdf' to generate a clean, text-based PDF version." },
      { question: "Can I convert complex Word files?", answer: "While we handle most common text features, very complex layouts, large images, or advanced tables may not render perfectly identical to the original Word file." },
      { question: "Is this tool safe for confidential work?", answer: "Absolutely. Everything happens locally in your browser. Your sensitive documents never leave your machine." }
    ]
  },
  {
    id: 'diff-checker',
    name: 'Diff Checker',
    description: 'Compare text and JSON differences with side-by-side or inline view.',
    path: 'diff-checker',
    category: 'Developer',
    tags: ['diff', 'compare', 'text', 'json'],
    inputType: ['text', 'json'],
    outputType: ['text', 'json'],
    icon: FileDiff,
    type: 'heavy',
    component: lazy(() => import('./diff-checker')),
    faqIcon: FileDiff,
    faq: [
      { question: "How does the 'Granularity' setting work?", answer: "It determines the smallest unit of comparison. 'Line' compares entire lines, while 'Word' and 'Char' highlight specific differences within those lines." },
      { question: "Can I compare JSON objects?", answer: "Yes, enable 'JSON Mode' and the tool will automatically format and normalize your JSON strings before comparing them." },
      { question: "Is my data privacy protected?", answer: "Yes, the entire comparison logic runs in your browser's memory. No text is sent to our servers, keeping your notes 100% secure." }
    ]
  },
  {
    id: 'compression-tool',
    name: 'Compression Tool',
    description: 'Gzip compress and decompress text or JSON payloads instantly.',
    path: 'compression-tool',
    category: 'Data',
    tags: ['compress', 'gzip', 'data'],
    inputType: ['text', 'json'],
    outputType: ['text', 'json'],
    icon: Minimize2,
    type: 'heavy',
    component: lazy(() => import('./compression-tool')),
    faqIcon: Minimize2,
    faq: [
      { question: "Which compression algorithms are used?", answer: "We primarily use Gzip (Zlib) for high-efficiency text compression. The output is provided as a Base64 string for easy transport." },
      { question: "What compression results can I expect?", answer: "For typical JSON or repetitive text, you can often see size reductions of 70% to 90%. Use the 'savings' badge in the output panel to see your results." },
      { question: "Can I decompress data from other sources?", answer: "Yes, as long as the data was compressed using standard Gzip/Zlib and is provided in a Base64 format." }
    ]
  },
  {
    id: 'data-visualizer',
    name: 'Data Visualizer',
    description: 'Visualize, filter, and chart JSON and CSV datasets dynamically.',
    path: 'data-visualizer',
    category: 'Data',
    tags: ['data', 'chart', 'visualize', 'json', 'csv'],
    inputType: ['json', 'csv'],
    outputType: ['image'],
    icon: BarChart2,
    type: 'heavy',
    component: lazy(() => import('./data-visualizer')),
    faqIcon: BarChart2,
    faq: [
      { question: "What file formats are supported?", answer: "We support standard JSON arrays and CSV files. For CSV, we automatically detect headers and parse data types like numbers and booleans." },
      { question: "Can I visualize large datasets?", answer: "Yes! Our visualizer can handle thousands of rows efficiently. For the best performance with charts, we recommend using datasets under 5,000 rows." },
      { question: "Is my data privacy protected?", answer: "Absolutely. All data parsing, filtering, and chart rendering happen locally in your browser. Your data is never uploaded to any server." }
    ]
  },
  // ── Creative Design Tools ───────────────────────────────────────────────────
  {
    id: 'svg-tracer',
    name: 'SVG Tracer',
    description: 'Convert PNG/JPG images into scalable SVG vector files with color depth and detail controls.',
    path: 'svg-tracer',
    category: 'Creative',
    tags: ['svg', 'vector', 'image', 'trace', 'figma'],
    inputType: ['image'],
    outputType: ['image'],
    icon: ScanLine,
    type: 'heavy',
    component: lazy(() => import('./svg-tracer')),
    faqIcon: ScanLine,
    faq: [
      { question: "What is an SVG tracer used for?", answer: "It converts raster images (like PNG or JPG) into vector paths (SVG). This allows you to scale the result infinitely without any loss of quality." },
      { question: "Which images work best for tracing?", answer: "High-contrast images with clean lines, like logos or silhouettes, yield the best results. Complex photos may result in very large, complex SVG files." },
      { question: "Can I edit the colors after tracing?", answer: "Yes, because the output is a standard SVG, you can open it in any vector editor and modify the paths and colors individually." }
    ]
  },
  {
    id: 'image-filter',
    name: 'Image Filter',
    description: 'Apply halftone, dither, neon glow, pixelate, posterize and more to any image in-browser.',
    path: 'image-filter',
    category: 'Creative',
    tags: ['filter', 'halftone', 'dither', 'image', 'effects'],
    inputType: ['image'],
    outputType: ['image'],
    icon: Wand2,
    type: 'heavy',
    component: lazy(() => import('./image-filter')),
    faqIcon: Wand2,
    faq: [
      { question: "What kind of effects can I apply?", answer: "We offer several artistic filters including Halftone (comic book style), Dithering (retro computer style), Neon Glow, and Pixelate, all computed in real-time." },
      { question: "Does the filter affect image resolution?", answer: "Filters are applied to the image data itself. While effects like 'Pixelate' intentionally reduce detail for style, the actual output resolution remains consistent with your source." },
      { question: "Is this tool free for commercial use?", answer: "All images processed here are your own property. Our tool is free to use, and we do not claim any rights to your processed images or add any watermarks." }
    ]
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art Generator',
    description: 'Convert photos into retro pixel art with Game Boy, NES, C64 and custom palettes.',
    path: 'pixel-art',
    category: 'Creative',
    tags: ['pixel', 'retro', 'art', 'image', 'gameboy', 'nes'],
    inputType: ['image'],
    outputType: ['image'],
    icon: Grid3x3,
    type: 'heavy',
    component: lazy(() => import('./pixel-art')),
    faqIcon: Grid3x3,
    faq: [
      { question: "How does the 'Palette' system work?", answer: "Our tool maps your image's colors to iconic retro palettes like Game Boy (4 shades of green), NES (classic 8-bit colors), and Commodore 64 for a truly authentic retro feel." },
      { question: "What is the best pixel size for icons?", answer: "For classic 8-bit style icons, we recommend a 32x32 or 64x64 grid. You can adjust the 'Grid Size' to find the perfect balance between detail and pixelation." },
      { question: "Can I export my art as a high-res image?", answer: "Yes! When you download, we automatically upscale the result using nearest-neighbor interpolation, so your pixel art remains sharp and crisp at any size without becoming blurry." }
    ]
  },
  {
    id: 'pattern-generator',
    name: 'Pattern Generator',
    description: 'Create beautiful geometric patterns — hexagons, waves, diamonds and more. Export as PNG or SVG.',
    path: 'pattern-generator',
    category: 'Creative',
    tags: ['pattern', 'geometric', 'svg', 'design', 'background'],
    inputType: ['any'],
    outputType: ['image'],
    icon: Shapes,
    type: 'heavy',
    component: lazy(() => import('./pattern-generator')),
    faqIcon: Shapes,
    faq: [
      { question: "Which pattern types are available?", answer: "We support over 10 geometric patterns including Hexagons, Waves, Diamonds, and Zig-zags. Each pattern is procedurally generated based on your settings." },
      { question: "Can I use these patterns as website backgrounds?", answer: "Absolutely. We recommend exporting as SVG for web backgrounds, as it's lightweight, resolution-independent, and easy to tile using CSS." },
      { question: "How do I customize the colors?", answer: "You can choose primary and secondary colors, or even apply a gradient. The tool instantly updates the preview so you can experiment with different color harmonies." }
    ]
  },
  {
    id: 'text-particle',
    name: 'Text Particle Effect',
    description: 'Animated particle text — watch any word explode into dots and reassemble in real-time.',
    path: 'text-particle',
    category: 'Creative',
    tags: ['particle', 'animation', 'canvas', 'text', 'effect'],
    inputType: ['text'],
    outputType: ['image'],
    icon: Sparkles,
    type: 'heavy',
    component: lazy(() => import('./text-particle')),
    faqIcon: Sparkles,
    faq: [
      { question: "How do the particles interact with text?", answer: "The particles are automatically distributed across the characters of your text. When you hover or click, the particles react with physics-based forces like explosion or attraction." },
      { question: "Can I record a video of the effect?", answer: "Yes, you can use screen recording tools to capture the animation. The resulting video is perfect for social media intros, landing pages, or digital signage." },
      { question: "Can I change the font style?", answer: "Yes, you can select from a variety of premium fonts and adjust the size and spacing to ensure the particle effect perfectly matches your brand's aesthetic." }
    ]
  },
  {
    id: 'geo-art',
    name: 'Geo Art Generator',
    description: 'Fill a 2×2 to 5×5 grid with random geometric shapes and export stunning abstract art as SVG or PNG.',
    path: 'geo-art',
    category: 'Creative',
    tags: ['geo', 'geometric', 'art', 'grid', 'abstract', 'svg', 'design'],
    inputType: ['any'],
    outputType: ['image'],
    icon: Shapes,
    type: 'heavy',
    component: lazy(() => import('./geo-art')),
    faqIcon: Shapes,
    faq: [
      { question: "How is the art generated?", answer: "Each piece is unique! Our algorithm fills a grid (from 2x2 to 5x5) with randomized geometric shapes, colors, and rotations using a curated set of aesthetic rules." },
      { question: "Can I generate a specific style?", answer: "While the generation is random, you can influence it by choosing a color palette or adjusting the complexity of the shapes used in the grid." },
      { question: "Is the output high-quality?", answer: "Yes, you can export your favorite designs as high-resolution PNGs or as SVGs, which are perfect for professional print projects or digital designs." }
    ]
  },
  {
    id: 'text-background',
    name: 'Text Background Generator',
    description: 'Create premium tilted repeating text backgrounds with custom fonts, colors, tilt and mask shapes. Export as PNG or SVG.',
    path: 'text-background',
    category: 'Creative',
    tags: ['text', 'background', 'pattern', 'font', 'design', 'website'],
    inputType: ['text'],
    outputType: ['image'],
    icon: Type,
    type: 'heavy',
    component: lazy(() => import('./text-background')),
    faqIcon: Type,
    faq: [
      { question: "What is a 'Text Background'?", answer: "It's an artistic effect where an image or video is clipped to the shape of your text. This creates a high-impact, modern visual style often used in hero sections of websites." },
      { question: "Can I use any font?", answer: "We recommend using thick, bold fonts (like 'Black' or 'Extra Bold' weights) to maximize the visibility of the background inside the characters." },
      { question: "How do I use this on my website?", answer: "You can download the result as a PNG for immediate use. For a more dynamic effect, we provide the CSS code snippet that uses 'background-clip: text' to achieve the same look with live text on your site." }
    ]
  },
  {
    id: 'live-particles',
    name: 'Live Particle Canvas',
    description: 'Interactive particle animations with 8 flow patterns — flower, vortex, starfield, text and more. Hover to interact, record as video, export as PNG.',
    path: 'live-particles',
    category: 'Creative',
    tags: ['particle', 'animation', 'canvas', 'interactive', 'live', 'record', 'pattern'],
    inputType: ['any'],
    outputType: ['image'],
    icon: Sparkles,
    type: 'heavy',
    component: lazy(() => import('./live-particles')),
    faqIcon: Sparkles,
    faq: [
      { question: "How do the particles react to my mouse?", answer: "The particles have built-in physics. Depending on the mode, they will either flee from your cursor, be attracted to it, or swirl around it like a vortex." },
      { question: "Can I use this as a background for my site?", answer: "Yes! While we offer PNG snapshots, you can also copy the Canvas/JavaScript configuration to integrate this interactive background directly into your own web projects." },
      { question: "Does this affect website performance?", answer: "Our engine is highly optimized using the HTML5 Canvas API. It can handle thousands of particles with high frame rates, though we recommend keeping the count under 2,000 for mobile compatibility." }
    ]
  },
  {
    id: 'remove-background',
    name: 'Background Remover v2',
    description: 'Extract subjects instantly with AI Magic Eraser or use Manual mode for precise chroma key removal.',
    path: 'remove-background',
    category: 'Creative',
    tags: ['background', 'remove', 'ai', 'magic-eraser', 'transparency', 'image'],
    inputType: ['image'],
    outputType: ['image'],
    icon: Eraser,
    type: 'heavy',
    component: lazy(() => import('./remove-background')),
    faqIcon: Sparkles,
    faq: [
      { question: "How does the Magic AI mode work?", answer: "Our Magic AI uses a deep learning model to automatically identify the main subject (person, product, or animal) and separate it from the background with pixel-perfect precision." },
      { question: "When should I use Manual mode?", answer: "Manual mode is best for images where the AI might struggle, such as complex textures or very subtle subjects. It allows you to select a specific background color to remove." },
      { question: "Is the AI processing private?", answer: "Yes! Everything happens locally in your browser using WASM. Your images are never uploaded to our servers, ensuring 100% privacy." }
    ]
  },
  // ── Pipeline-only Nodes ─────────────────────────────────────────────────────
  {
    id: 'file-share',
    name: 'Temporary File Share',
    description: 'Securely upload and share files, images, and videos. Links expire in 2 days automatically.',
    path: 'file-share',
    category: 'Network',
    tags: ['file', 'share', 'upload', 'cloud', 'storage'],
    inputType: ['any'],
    outputType: ['url'],
    icon: UploadCloud,
    type: 'heavy',
    component: lazy(() => import('./file-share')),
    faqIcon: UploadCloud,
    faq: [
      { question: "How long do my shared files stay active?", answer: "All shared files are automatically deleted after 48 hours for your security and to keep the storage clean." },
      { question: "Is there a file size limit?", answer: "Yes, you can upload files up to 50MB. This limit ensures that the service remains fast for all users while providing ample space." },
      { question: "Which file types are supported?", answer: "We support almost all file types including images, videos, PDFs, and documents. For safety, we do not allow executable binary files." }
    ]
  },
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Compress and optimize images (WebP, JPG, PNG) to your target KB size with smart presets and AI fallback.',
    path: 'image-compressor',
    category: 'Media',
    tags: ['compress', 'image', 'optimize', 'webp', 'jpg', 'png'],
    inputType: ['image'],
    outputType: ['image'],
    icon: Minimize2,
    type: 'heavy',
    component: lazy(() => import('./image-compressor')),
    faqIcon: Minimize2,
    faq: [
      { question: "Is my image quality affected?", answer: "Our optimizer uses a smart binary search algorithm to find the best quality-to-size ratio. Minor quality loss may occur to hit aggressive target sizes, but we prioritize visual fidelity." },
      { question: "What is the recommended format?", answer: "We recommend WebP. It typically provides 30% better compression than JPEG while maintaining identical visual quality." },
      { question: "Are large files handled?", answer: "Yes! Images under 5MB are processed instantly in your browser. Larger images are seamlessly routed to our edge processing engine for optimal results." }
    ]
  },
  {
    id: 'parquet-converter',
    name: 'Parquet to CSV/JSON',
    description: 'Extract data from Apache Parquet files into readable CSV or JSON formats.',
    path: 'data-converter',
    category: 'Data',
    tags: ['parquet', 'csv', 'json', 'convert'],
    inputType: ['parquet'],
    outputType: ['csv', 'json'],
    icon: FileCode,
    type: 'light',
    component: lazy(() => import('./data-converter')),
  },
  {
    id: 'js-compiler',
    name: 'JavaScript IDE Pro',
    description: 'Professional JavaScript environment with real-time console output, Monaco editor, and modern Result Pane.',
    path: 'js-compiler',
    category: 'Programming',
    tags: ['javascript', 'js', 'run', 'playground', 'ide', 'monaco'],
    inputType: ['text'],
    outputType: ['text'],
    icon: Code2,
    type: 'light',
    component: lazy(() => import('./js-node-compiler')),
    faqIcon: Code2,
    longDescription: 'js-compiler',
    faq: [
      { question: "Is my code executed on a server?", answer: "No, the JavaScript IDE Pro executes your code natively in your browser's sandboxed environment. This ensures 100% privacy and zero latency." },
      { question: "What is the 'Result Pane'?", answer: "The Result Pane is a custom-built output console that captures all 'console.log' statements, errors, and execution metrics in a clean, visual format inspired by professional IDEs." },
      { question: "Can I use modern JavaScript features?", answer: "Yes! Since it runs in your browser, you can use all ES6+ features supported by your browser version, including async/await, optional chaining, and more." }
    ]
  },
  {
    id: 'sql-playground',
    name: 'SQL Playground',
    description: 'WASM-powered scalable PostgreSQL sandbox. Write, run, and test full SQL databases natively in your browser.',
    path: 'sql-playground',
    category: 'Programming',
    tags: ['sql', 'database', 'postgres', 'postgresql', 'query', 'sandbox'],
    inputType: ['text'],
    outputType: ['text', 'json'],
    icon: Database,
    type: 'light',
    component: lazy(() => import('./sql-playground')),
    faqIcon: Database,
    longDescription: 'sql-playground',
    faq: [
      { question: "Is my database hosted on a server?", answer: "No, the SQL Playground runs completely locally inside your browser using a WebAssembly (WASM) build of PostgreSQL. Fast, scalable, and 100% private." },
      { question: "Can I persist my database between sessions?", answer: "Currently, databases run in an ephemeral sandbox to ensure a clean testing slate every time you run. It's meant for rapid prototyping, learning, and testing logic." },
      { question: "What SQL dialect is supported?", answer: "Since it is running real PostgreSQL, it supports full PostgreSQL 16 standard syntax, constraints, and features, ensuring perfect parity with production backends." }
    ]
  },
  {
    id: 'curl-converter',
    name: 'cURL to Code Converter',
    description: 'Transform cURL commands into clean, executable code for Python, JavaScript, Go, PHP, and more instantly.',
    path: 'curl-converter',
    category: 'Programming',
    tags: ['curl', 'convert', 'python', 'javascript', 'api', 'dev'],
    inputType: ['text'],
    outputType: ['text'],
    icon: Terminal,
    type: 'light',
    component: lazy(() => import('./curl-converter')),
    faqIcon: Terminal,
    longDescription: 'curl-converter',
    faq: [
      { question: "How does the conversion work?", answer: "We use a port of the popular 'curlconverter' library that parses the raw cURL command and generates idiomatic code snippets for your target language." },
      { question: "Are my API keys and tokens safe?", answer: "Yes. All processing is done locally in your browser. Your sensitive headers and credentials never leave your machine, making it safe for production workflows." },
      { question: "Which languages are supported?", answer: "Currently, we support Python (Requests), JavaScript (Fetch/Axios), Node.js, Go, PHP, Rust, Java, and C# out of the box." }
    ]
  },
  {
    id: 'notes-app',
    name: 'NoteSpace',
    description: 'A fluid, professional block-based notes app with local-first storage, templates, and interactive table management.',
    path: 'notes-app',
    category: 'Writing',
    tags: ['notes', 'writing', 'blocks', 'text'],
    inputType: ['text', 'any'],
    outputType: ['text', 'any'],
    icon: FileText,
    type: 'heavy',
    component: lazy(() => import('./notes-app')),
    faqIcon: FileText,
    fullScreen: true,
    faq: [
      { question: "Where is my data saved?", answer: "All notes and blocks are saved locally inside your browser using IndexedDB. This ensures maximum privacy, offline support, and speed." },
      { question: "Can I use templates?", answer: "Yes! Use the Sidebar to add pre-built templates for Students, Classrooms, and more to jumpstart your productivity." },
      { question: "How do I manage tables?", answer: "NoteSpace features an interactive table editor where you can add rows/columns, edit cells inline, and even import CSV or JSON data directly." }
    ]
  },
  {
    id: 'ocr-tool',
    name: 'AI OCR Scanner',
    description: 'Extract text from images, screenshots and scanned documents with professional accuracy.',
    path: 'ocr-tool',
    category: 'Media',
    tags: ['ocr', 'text', 'extract', 'image', 'ai'],
    inputType: ['image'],
    outputType: ['text'],
    icon: ScanText,
    type: 'heavy',
    component: lazy(() => import('./ocr-tool')),
    faqIcon: ScanText,
    faq: [
      { question: "Which languages are supported?", answer: "We support over 10 languages including English, Spanish, French, German, Chinese, Japanese, Hindi, and Arabic." },
      { question: "Is my image uploaded to a server?", answer: "No, all OCR processing happens locally in your browser using Tesseract.js WASM. Your data never leaves your device." },
      { question: "Can it scan handwriting?", answer: "It works best with printed text. While it can attempt handwriting, accuracy may vary significantly depending on legibility." }
    ]
  },
  {
    id: 'speech-to-text',
    name: 'Speech to Text',
    description: 'Convert audio and video files into accurate text locally using Whisper AI.',
    path: 'speech-to-text',
    category: 'Media',
    tags: ['speech', 'audio', 'transcribe', 'whisper', 'ai'],
    inputType: ['any'],
    outputType: ['text'],
    icon: Mic,
    type: 'heavy',
    component: lazy(() => import('./speech-to-text')),
    faqIcon: Mic,
    faq: [
      { question: "How does the transcription work?", answer: "We use OpenAI's Whisper model running locally via Transformers.js and WASM. It can even use your GPU (WebGPU) for faster processing." },
      { question: "What audio formats are supported?", answer: "You can upload almost any audio or video format, including MP3, WAV, M4A, OGG, and MP4." },
      { question: "Is there a file size limit?", answer: "For the best experience in the browser, we recommend files under 50MB. Larger files may cause the browser to become unresponsive during processing." }
    ]
  },
];
