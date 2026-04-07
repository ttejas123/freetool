import { useState, useRef, useEffect } from 'react';
import QRCodeStyling, { 
  type TypeNumber, 
  type Mode, 
  type ErrorCorrectionLevel, 
  type DotType, 
  type CornerSquareType, 
  type CornerDotType,
  type FileExtension
} from 'qr-code-styling';
import { jsPDF } from 'jspdf';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  Download, 
  Link as LinkIcon, 
  FileText, 
  Mail, 
  Phone, 
  MessageCircle, 
  Wifi, 
  User, 
  Palette, 
  Settings, 
  Image as ImageIcon,
  Type,
  Layers,
  Check,
  ChevronRight,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';

type QrType = 'url' | 'text' | 'email' | 'phone' | 'whatsapp' | 'wifi' | 'vcard';

export default function QrGenerator() {
  const [type, setType] = useState<QrType>('url');
  const [options, setOptions] = useState({
    width: 300,
    height: 300,
    margin: 10,
    dotsOptions: {
      color: '#000000',
      type: 'square' as DotType,
      gradient: {
        type: 'linear' as 'linear' | 'radial',
        rotation: 0,
        colorStops: [
          { offset: 0, color: '#000000' },
          { offset: 1, color: '#000000' }
        ]
      }
    },
    backgroundOptions: {
      color: '#ffffff',
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 5,
      imageSize: 0.4
    },
    cornersSquareOptions: {
      color: '#000000',
      type: 'square' as CornerSquareType,
    },
    cornersDotOptions: {
      color: '#000000',
      type: 'square' as CornerDotType,
    },
    qrOptions: {
      typeNumber: 0 as TypeNumber,
      mode: 'Byte' as Mode,
      errorCorrectionLevel: 'H' as ErrorCorrectionLevel
    },
    image: '',
  });

  // Specific data for each type
  const [urlData, setUrlData] = useState('https://example.com');
  const [textData, setTextData] = useState('');
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
  const [phoneData, setPhoneData] = useState('');
  const [whatsappData, setWhatsappData] = useState({ phone: '', message: '' });
  const [wifiData, setWifiData] = useState({ ssid: '', password: '', encryption: 'WPA' });
  const [vcardData, setVcardData] = useState({ 
    firstName: '', lastName: '', org: '', title: '', phone: '', email: '', url: '', address: '' 
  });

  const qrRef = useRef<HTMLDivElement>(null);
  const [qrCode] = useState(() => new QRCodeStyling(options));

  // Update QR when content or options change
  useEffect(() => {
    let finalContent = '';
    switch (type) {
      case 'url': finalContent = urlData; break;
      case 'text': finalContent = textData; break;
      case 'email': finalContent = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`; break;
      case 'phone': finalContent = `tel:${phoneData}`; break;
      case 'whatsapp': finalContent = `https://wa.me/${phoneData.replace(/\+/g, '')}?text=${encodeURIComponent(whatsappData.message)}`; break;
      case 'wifi': finalContent = `WIFI:S:${wifiData.ssid};T:${wifiData.encryption};P:${wifiData.password};;`; break;
      case 'vcard': 
        finalContent = `BEGIN:VCARD\nVERSION:3.0\nN:${vcardData.lastName};${vcardData.firstName}\nFN:${vcardData.firstName} ${vcardData.lastName}\nORG:${vcardData.org}\nTITLE:${vcardData.title}\nTEL;TYPE=CELL:${vcardData.phone}\nEMAIL:${vcardData.email}\nURL:${vcardData.url}\nADR:;;${vcardData.address}\nEND:VCARD`;
        break;
    }
    qrCode.update({ 
      ...options,
      data: finalContent || ' ' 
    });
  }, [type, urlData, textData, emailData, phoneData, whatsappData, wifiData, vcardData, options, qrCode]);

  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCode.append(qrRef.current);
    }
  }, [qrCode]);

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOptions(prev => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const download = (ext: FileExtension | 'pdf') => {
    if (ext === 'pdf') {
      const doc = new jsPDF();
      qrCode.getRawData('png').then((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imgData = e.target?.result as string;
            doc.addImage(imgData, 'PNG', 40, 40, 130, 130);
            doc.save('qr-code.pdf');
          };
          reader.readAsDataURL(blob as Blob);
        }
      });
    } else {
      qrCode.download({ name: 'qr-code', extension: ext as FileExtension });
    }
  };

  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'logo' | 'colors'>('content');

  const qrTypes = [
    { id: 'url', icon: LinkIcon, label: 'URL' },
    { id: 'text', icon: FileText, label: 'Text' },
    { id: 'email', icon: Mail, label: 'Email' },
    { id: 'phone', icon: Phone, label: 'Phone' },
    { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
    { id: 'wifi', icon: Wifi, label: 'WiFi' },
    { id: 'vcard', icon: User, label: 'vCard' },
  ] as const;

  const patterns: { id: DotType; label: string }[] = [
    { id: 'square', label: 'Square' },
    { id: 'dots', label: 'Dots' },
    { id: 'rounded', label: 'Rounded' },
    { id: 'extra-rounded', label: 'Extra Rounded' },
    { id: 'classy', label: 'Classy' },
    { id: 'classy-rounded', label: 'Classy Rounded' },
  ];

  const cornerSquares: { id: CornerSquareType; label: string }[] = [
    { id: 'square', label: 'Square' },
    { id: 'dot', label: 'Dot' },
    { id: 'extra-rounded', label: 'Extra Rounded' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <SEOHelmet title="Premium QR Code Generator" description="Generate professional, custom-branded QR codes with logos, colors, and gradients." />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Professional QR Generator <span className="text-xs uppercase bg-brand-500 text-white px-2 py-0.5 rounded-full">v2</span>
          </h1>
          <p className="mt-1 text-gray-500">Create high-quality, branded QR codes for any purpose.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Controls */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-6">
          {/* Main Tabs */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto no-scrollbar">
            {[
              { id: 'content', icon: Type, label: 'Content' },
              { id: 'style', icon: Layers, label: 'Style' },
              { id: 'colors', icon: Palette, label: 'Colors' },
              { id: 'logo', icon: ImageIcon, label: 'Logo' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6">
              {activeTab === 'content' && (
                <div className="space-y-6">
                  {/* QR Type Selection */}
                  <div className="flex flex-wrap gap-2">
                    {qrTypes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setType(t.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
                          type === t.id 
                            ? "bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-900/30 dark:border-brand-800 dark:text-brand-400" 
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                        )}
                      >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    {type === 'url' && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Target URL</label>
                        <Input 
                          value={urlData} 
                          onChange={e => setUrlData(e.target.value)} 
                          placeholder="https://yourwebsite.com" 
                        />
                      </div>
                    )}

                    {type === 'text' && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Message Content</label>
                        <Textarea 
                          value={textData} 
                          onChange={e => setTextData(e.target.value)} 
                          placeholder="Write your message here..."
                          className="min-h-[120px]"
                        />
                      </div>
                    )}

                    {type === 'email' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recipient Email</label>
                          <Input 
                            value={emailData.to} 
                            onChange={e => setEmailData({...emailData, to: e.target.value})} 
                            placeholder="hello@example.com" 
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subject</label>
                          <Input 
                            value={emailData.subject} 
                            onChange={e => setEmailData({...emailData, subject: e.target.value})} 
                            placeholder="Subject line" 
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Body</label>
                          <Textarea 
                            value={emailData.body} 
                            onChange={e => setEmailData({...emailData, body: e.target.value})} 
                            placeholder="Email content..." 
                          />
                        </div>
                      </div>
                    )}

                    {type === 'wifi' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">SSID (Network Name)</label>
                          <Input 
                            value={wifiData.ssid} 
                            onChange={e => setWifiData({...wifiData, ssid: e.target.value})} 
                            placeholder="Home WiFi" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                          <Input 
                            type="password" 
                            value={wifiData.password} 
                            onChange={e => setWifiData({...wifiData, password: e.target.value})} 
                            placeholder="••••••••" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Encryption</label>
                          <select 
                            className="w-full flex h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                            value={wifiData.encryption}
                            onChange={e => setWifiData({...wifiData, encryption: e.target.value})}
                          >
                            <option value="WPA">WPA/WPA2</option>
                            <option value="WEP">WEP</option>
                            <option value="nopass">No Password</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {type === 'vcard' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">First Name</label>
                          <Input value={vcardData.firstName} onChange={e => setVcardData({...vcardData, firstName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Last Name</label>
                          <Input value={vcardData.lastName} onChange={e => setVcardData({...vcardData, lastName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                          <Input value={vcardData.email} onChange={e => setVcardData({...vcardData, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                          <Input value={vcardData.phone} onChange={e => setVcardData({...vcardData, phone: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Organization</label>
                          <Input value={vcardData.org} onChange={e => setVcardData({...vcardData, org: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Title</label>
                          <Input value={vcardData.title} onChange={e => setVcardData({...vcardData, title: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Website URL</label>
                          <Input value={vcardData.url} onChange={e => setVcardData({...vcardData, url: e.target.value})} />
                        </div>
                      </div>
                    )}

                    {(type === 'phone' || type === 'whatsapp') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone Number (with country code)</label>
                          <Input 
                            value={type === 'phone' ? phoneData : whatsappData.phone} 
                            onChange={e => type === 'phone' ? setPhoneData(e.target.value) : setWhatsappData({...whatsappData, phone: e.target.value})} 
                            placeholder="+1234567890" 
                          />
                        </div>
                        {type === 'whatsapp' && (
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pre-filled Message</label>
                            <Input 
                              value={whatsappData.message} 
                              onChange={e => setWhatsappData({...whatsappData, message: e.target.value})} 
                              placeholder="Hello, I'm reaching out from the QR code..." 
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'style' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <GridBackground className="w-5 h-5" /> Main Pattern
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {patterns.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setOptions({ ...options, dotsOptions: { ...options.dotsOptions, type: p.id } })}
                          className={cn(
                            "p-3 rounded-xl border-2 text-sm font-medium transition-all text-center",
                            options.dotsOptions.type === p.id 
                              ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400" 
                              : "border-gray-100 hover:border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-400"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Corner Squares</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {cornerSquares.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setOptions({ ...options, cornersSquareOptions: { ...options.cornersSquareOptions, type: c.id } })}
                          className={cn(
                            "p-3 rounded-xl border-2 text-sm font-medium transition-all text-center",
                            options.cornersSquareOptions.type === c.id 
                              ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400" 
                              : "border-gray-100 hover:border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-400"
                          )}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Padding & Precision</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Margin</label>
                          <span className="text-xs text-gray-400">{options.margin}px</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" 
                          value={options.margin} 
                          onChange={(e) => setOptions({ ...options, margin: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Error Correction</label>
                        <select 
                          className="w-full flex h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-950"
                          value={options.qrOptions.errorCorrectionLevel}
                          onChange={(e) => setOptions({ ...options, qrOptions: { ...options.qrOptions, errorCorrectionLevel: e.target.value as any } })}
                        >
                          <option value="L">Low (7%)</option>
                          <option value="M">Medium (15%)</option>
                          <option value="Q">Quartile (25%)</option>
                          <option value="H">High (30% - for Logos)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'colors' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Dots Color */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Palette className="w-5 h-5 text-brand-500" /> Pattern Colors
                      </h3>
                      
                      <div className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="space-y-2 flex-col">
                          <label className="text-xs uppercase tracking-wider font-bold text-gray-400">Color 1</label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="color" 
                              value={options.dotsOptions.gradient.colorStops[0].color} 
                              onChange={(e) => {
                                const stops = [...options.dotsOptions.gradient.colorStops];
                                stops[0].color = e.target.value;
                                setOptions({ ...options, dotsOptions: { ...options.dotsOptions, color: e.target.value, gradient: { ...options.dotsOptions.gradient, colorStops: stops } } });
                              }}
                              className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
                            />
                            <span className="text-sm font-mono">{options.dotsOptions.gradient.colorStops[0].color.toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wider font-bold text-gray-400">Color 2 (Gradient)</label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="color" 
                              value={options.dotsOptions.gradient.colorStops[1].color} 
                              onChange={(e) => {
                                const stops = [...options.dotsOptions.gradient.colorStops];
                                stops[1].color = e.target.value;
                                setOptions({ ...options, dotsOptions: { ...options.dotsOptions, gradient: { ...options.dotsOptions.gradient, colorStops: stops } } });
                              }}
                              className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
                            />
                            <span className="text-sm font-mono">{options.dotsOptions.gradient.colorStops[1].color.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gradient Rotation</label>
                        <input 
                          type="range" min="0" max="360" 
                          value={options.dotsOptions.gradient.rotation} 
                          onChange={(e) => setOptions({ ...options, dotsOptions: { ...options.dotsOptions, gradient: { ...options.dotsOptions.gradient, rotation: parseInt(e.target.value) } } })}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                        <div className="flex justify-end text-xs text-gray-400">{options.dotsOptions.gradient.rotation}°</div>
                      </div>
                    </div>

                    {/* Background & Corners */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-brand-500" /> Background & Corners
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                          <label className="text-xs uppercase tracking-wider font-bold text-gray-400 block mb-2">Background</label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="color" 
                              value={options.backgroundOptions.color} 
                              onChange={(e) => setOptions({ ...options, backgroundOptions: { ...options.backgroundOptions, color: e.target.value } })}
                              className="w-10 h-10 rounded-lg cursor-pointer"
                            />
                            <span className="text-sm font-mono">{options.backgroundOptions.color.toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                          <label className="text-xs uppercase tracking-wider font-bold text-gray-400 block mb-2">Corner Square</label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="color" 
                              value={options.cornersSquareOptions?.color || '#000000'} 
                              onChange={(e) => setOptions({ ...options, cornersSquareOptions: { ...options.cornersSquareOptions, color: e.target.value } })}
                              className="w-10 h-10 rounded-lg cursor-pointer"
                            />
                            <span className="text-sm font-mono">{options.cornersSquareOptions?.color?.toUpperCase() || '#000000'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'logo' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Upload className="w-5 h-5 text-brand-500" /> Center Logo
                      </h3>
                      <p className="text-sm text-gray-500">Add your company logo or a custom icon to the center of the QR code.</p>
                      
                      <div className="relative group">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl cursor-pointer hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-gray-400 group-hover:text-brand-500" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                        </label>
                      </div>

                      {options.image && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setOptions({...options, image: ''})}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          Remove Logo
                        </Button>
                      )}
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Placement Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo Size</label>
                            <span className="text-xs text-gray-400">{(options.imageOptions.imageSize * 100).toFixed(0)}%</span>
                          </div>
                          <input 
                            type="range" min="0.1" max="0.5" step="0.05"
                            value={options.imageOptions.imageSize} 
                            onChange={(e) => setOptions({ ...options, imageOptions: { ...options.imageOptions, imageSize: parseFloat(e.target.value) } })}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Buffer Texture</label>
                            <span className="text-xs text-gray-400">{options.imageOptions.margin}px</span>
                          </div>
                          <input 
                            type="range" min="0" max="20" 
                            value={options.imageOptions.margin} 
                            onChange={(e) => setOptions({ ...options, imageOptions: { ...options.imageOptions, margin: parseInt(e.target.value) } })}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                        <p className="text-xs text-amber-700 dark:text-amber-400 flex gap-2">
                          <span className="font-bold">TIP:</span> Use 'High' error correction in the Style tab for better scan reliability when using large logos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:col-span-12 xl:col-span-4 bottom-0 xl:sticky xl:top-24 space-y-6">
          <Card className="overflow-hidden border-none shadow-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-100 dark:ring-gray-800">
            <div className="p-6 pb-0 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Live Preview</h2>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] uppercase font-bold text-gray-400">Real-time</span>
              </div>
            </div>
            
            <CardContent className="p-8 flex flex-col items-center">
              <div 
                className="p-4 bg-white rounded-2xl shadow-inner border border-gray-50 flex items-center justify-center overflow-hidden" 
                style={{ width: '300px', height: '300px' }}
                ref={qrRef} 
              />
              
              <div className="w-full mt-10 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Download Formats</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => download('png')} 
                    className="flex flex-col gap-1 h-auto py-3 bg-brand-600 hover:bg-brand-700"
                  >
                    <Download className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">PNG</span>
                    <span className="text-[10px] opacity-70">Best for web</span>
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => download('svg')} 
                    className="flex flex-col gap-1 h-auto py-3 dark:bg-gray-800"
                  >
                    <FileText className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">SVG</span>
                    <span className="text-[10px] opacity-70">Best for design</span>
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => download('pdf' as any)} 
                    className="col-span-2 flex items-center justify-center gap-2 py-3 border-dashed border-2"
                  >
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold">Generate PDF Export</span>
                  </Button>
                </div>
              </div>
            </CardContent>

            <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">
                Safe & Private • Full Resolution • No Expiration
              </p>
            </div>
          </Card>

          <div className="hidden xl:block p-4 rounded-xl bg-brand-50/30 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/20">
             <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-900 dark:text-brand-300">Pro Tip</h4>
                  <p className="text-xs text-brand-600/80 dark:text-brand-400/80 mt-1">
                    Try "Dots" with a linear gradient and "Extra Rounded" corners for a high-end tech aesthetic.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GridBackground({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  );
}

