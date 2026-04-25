'use client';

import { useState } from 'react';
import { Mail, MessageCircle, Phone, MapPin, Send, Twitter, Github, Linkedin, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    message: '',
    services: [] as string[]
  });

  const servicesList = [
    'Feature Request',
    'Report a Bug',
    'Business Inquiry',
    'Technical Support',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([{
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phoneNumber,
          message: formData.message,
          services: formData.services
        }]);

      if (error) throw error;
      
      setSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        message: '',
        services: []
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Submission error:', err);
      alert('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s: string) => s !== service)
        : [...prev.services, service]
    }));
  };

  return (
    <div className="min-h-screen bg-transparent py-16 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Contact our team
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Got any questions about the platform or looking to collaborate? We're here to help. 
            Chat with us and get onboard in less than 5 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form Section */}
          <div className="bg-white dark:bg-[#0A0A0A] p-8 md:p-12 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
                  <input
                    type="text"
                    id="firstName"
                    required
                    placeholder="First name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D0D0D] text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
                  <input
                    type="text"
                    id="lastName"
                    required
                    placeholder="Last name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D0D0D] text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D0D0D] text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone number</label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D0D0D] text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  placeholder="Leave us a message..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D0D0D] text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none"
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select reason</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {servicesList.map((service) => (
                    <label 
                      key={service}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                        formData.services.includes(service)
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400 shadow-sm'
                        : 'border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={formData.services.includes(service)}
                        onChange={() => toggleService(service)}
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.services.includes(service) ? 'border-brand-500 bg-brand-500' : 'border-gray-300 dark:border-gray-700'
                      }`}>
                        {formData.services.includes(service) && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                      <span className="text-sm">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-200 dark:shadow-none flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : submitted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 animate-in zoom-in" />
                    Sent successfully
                  </>
                ) : (
                  <>
                    Send message
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Info Section */}
          <div className="flex flex-col justify-center space-y-12">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Chat with us</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Speak to our friendly team via live chat.</p>
                  <div className="flex flex-col gap-2">
                    <a href="https://twitter.com/tejasthakare73" className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:opacity-80 transition-opacity">
                      <Twitter className="w-4 h-4" /> Start active chat
                    </a>
                    <a href="mailto:tthakare73@gmail.com" className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:opacity-80 transition-opacity">
                      <Mail className="w-4 h-4" /> Shoot us an email
                    </a>
                    <a href="https://github.com/ttejas123" className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:opacity-80 transition-opacity">
                      <Github className="w-4 h-4" /> Message on GitHub
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Call us</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Available for critical issues Mon-Fri, 6:30pm to 11:30pm IST.</p>
                  <a href="tel:+918433841610" className="text-brand-600 dark:text-brand-400 font-bold text-lg hover:underline transition-all">
                    +91 8433841610
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Visit us</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Chat to us in person at our HQ.</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Shiv-shakti so, A-35, 0/4, Sector-15, Near Aayappa Mandir, <br />
                    Navi Mumbai, Maharashtra, India 400708
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 dark:border-white/5">
              <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Social Connect</h4>
              <div className="flex gap-6">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-brand-500 hover:text-white transition-all transform hover:-translate-y-1">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://www.github.com/ttejas123" className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-brand-500 hover:text-white transition-all transform hover:-translate-y-1">
                  <Github className="w-5 h-5" />
                </a>
                <a href="https://www.linkedin.com/in/tejas-thakare-041281152/" className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-brand-500 hover:text-white transition-all transform hover:-translate-y-1">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
