/**
 * Client-safe Email Templates and utilities
 */

export const EMAIL_TEMPLATES = {
  template1: {
    name: 'Friendly Outreach (English)',
    subject: 'Build a Beautiful Website for {{RestaurantName}} 🍽️',
    body: `<p>Hello <strong>{{RestaurantName}}</strong>,</p>

<p>We found your restaurant while searching for great places in <strong>{{City}}</strong>.</p>

<p>Your food looks amazing! 😍</p>

<p>We noticed that your business does not currently have an official website. A professional website can help your customers:</p>

<ul>
  <li>✅ Find your restaurant on Google</li>
  <li>✅ View your menu online</li>
  <li>✅ Book tables in advance</li>
  <li>✅ Order food online</li>
  <li>✅ Build customer trust &amp; loyalty</li>
</ul>

<p>We would love to build a beautiful, fast, and affordable website for <strong>{{RestaurantName}}</strong>.</p>

<p>📍 <em>{{Address}}</em></p>

<p>Please feel free to reach out to us. We'd love to chat!</p>

<p>Warm regards,<br/>
<strong>{{AgencyName}}</strong><br/>
{{AgencyWebsite}}</p>`,
  },
  template2: {
    name: 'Professional Pitch (English)',
    subject: '🚀 Grow {{RestaurantName}} Online — Free Website Consultation',
    body: `<p>Dear Owner of <strong>{{RestaurantName}}</strong>,</p>

<p>I hope this message finds you well.</p>

<p>My name is from <strong>{{AgencyName}}</strong>, a web development agency specializing in helping restaurants across Uttarakhand grow their business online.</p>

<p>While exploring top-rated restaurants in <strong>{{City}}</strong>, we came across your establishment at:</p>

<blockquote><em>{{Address}}</em></blockquote>

<p>We noticed that <strong>{{RestaurantName}}</strong> does not yet have a website. In today's digital world, over <strong>70% of customers</strong> search online before visiting a restaurant. Without a website, you may be missing out on hundreds of potential customers every month.</p>

<h3>What we offer:</h3>
<ul>
  <li>🌐 Professional restaurant website</li>
  <li>📱 Mobile-friendly &amp; fast</li>
  <li>🔍 Google-optimized (SEO)</li>
  <li>🍽️ Digital menu integration</li>
  <li>📞 Online booking system</li>
  <li>💬 WhatsApp &amp; social media integration</li>
</ul>

<p>We'd love to offer you a <strong>free consultation</strong> to discuss how we can help grow your restaurant's online presence.</p>

<p>Best regards,<br/>
<strong>{{AgencyName}}</strong><br/>
📧 {{AgencyEmail}}<br/>
📞 {{AgencyPhone}}<br/>
🌐 {{AgencyWebsite}}</p>`,
  },
}

/** Replace template variables in a string */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}
