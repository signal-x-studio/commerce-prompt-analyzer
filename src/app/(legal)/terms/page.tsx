import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Commerce Prompt Analyzer',
  description: 'Terms of Service for Commerce Prompt Analyzer',
}

export default function TermsOfServicePage() {
  return (
    <article className="prose prose-neutral max-w-none">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground"><strong>Last Updated:</strong> November 29, 2024</p>

          <p>
            These Terms of Service ("Terms") govern your access to and use of Commerce Prompt
            Analyzer (the "Service") operated by Signal X Studio ("we," "our," or "us").
          </p>

          <p>
            By accessing or using the Service, you agree to be bound by these Terms. If you
            do not agree, do not use the Service.
          </p>

          <hr />

          <h2>1. Acceptance of Terms</h2>

          <p>By using the Service, you represent that:</p>
          <ul>
            <li>You are at least 18 years old</li>
            <li>You have the authority to enter into these Terms</li>
            <li>Your use complies with all applicable laws and regulations</li>
          </ul>

          <p>
            If you are using the Service on behalf of an organization, you represent that you
            have authority to bind that organization to these Terms.
          </p>

          <hr />

          <h2>2. Description of Service</h2>

          <p>
            Commerce Prompt Analyzer is an AI-powered tool that analyzes e-commerce category
            pages for Answer Engine visibility. The Service provides:
          </p>
          <ul>
            <li>E-commerce URL analysis and product catalog structure assessment</li>
            <li>Customer search prompt generation for AI answer engines</li>
            <li>Competitive gap analysis and visibility diagnostics</li>
            <li>Multi-provider AI analysis (Gemini, OpenAI, Claude, Perplexity)</li>
            <li>Real-time API cost tracking</li>
          </ul>

          <p>We reserve the right to modify, suspend, or discontinue the Service at any time without notice.</p>

          <hr />

          <h2>3. API Keys and Costs</h2>

          <h3>3.1 Bring Your Own Keys (BYOK)</h3>
          <p>
            The Service requires you to provide your own API keys for third-party AI providers.
            You are responsible for:
          </p>
          <ul>
            <li>Obtaining valid API keys from each provider you wish to use</li>
            <li>Maintaining the security of your API keys</li>
            <li>All costs incurred through use of your API keys</li>
            <li>Compliance with each provider's terms of service</li>
          </ul>

          <h3>3.2 Cost Responsibility</h3>
          <p>
            The Service displays estimated API costs in real-time. You acknowledge that:
          </p>
          <ul>
            <li>Displayed costs are estimates and may differ from actual charges</li>
            <li>You are solely responsible for all API charges from third-party providers</li>
            <li>We are not liable for unexpected or excessive API costs</li>
          </ul>

          <hr />

          <h2>4. Acceptable Use</h2>

          <p>You agree not to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights of others</li>
            <li>Analyze URLs you do not own or have authorization to analyze</li>
            <li>Use the scraping features to violate target sites' terms of service</li>
            <li>Transmit malware, viruses, or harmful code</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Use the Service for illegal, fraudulent, or harmful purposes</li>
            <li>Abuse API rate limits or overwhelm third-party services</li>
            <li>Use scraped data for purposes beyond competitive analysis</li>
          </ul>

          <p>We may terminate your access for violations of these terms.</p>

          <hr />

          <h2>5. Web Scraping</h2>

          <p>
            The Service includes web scraping functionality for e-commerce analysis. By using
            this feature, you agree that:
          </p>
          <ul>
            <li>You have authorization to scrape the URLs you submit</li>
            <li>You will comply with robots.txt and terms of service of target sites</li>
            <li>You will not use scraped data for purposes other than analysis</li>
            <li>You are solely responsible for the legality of your scraping activities</li>
            <li>We are not liable for any claims arising from your scraping activities</li>
          </ul>

          <hr />

          <h2>6. Third-Party AI Services</h2>

          <h3>6.1 Third-Party Providers</h3>
          <p>
            The Service integrates with multiple AI providers (Google, OpenAI, Anthropic,
            Perplexity, Tavily). Your use of these integrations is subject to each provider's
            terms and policies.
          </p>

          <h3>6.2 AI Output Disclaimer</h3>
          <p>
            AI-generated analysis is provided for informational purposes only. We do not
            guarantee the accuracy, completeness, or reliability of AI outputs. You are
            responsible for:
          </p>
          <ul>
            <li>Verifying any AI-generated analysis before acting on it</li>
            <li>Understanding that AI responses may contain errors or inaccuracies</li>
            <li>Making independent business decisions based on multiple data sources</li>
          </ul>

          <hr />

          <h2>7. Intellectual Property</h2>

          <h3>7.1 Our Intellectual Property</h3>
          <p>
            The Service, including its original content, features, and functionality, is owned
            by Signal X Studio and protected by copyright, trademark, and other intellectual
            property laws.
          </p>

          <h3>7.2 Your Content</h3>
          <p>
            You retain ownership of URLs and data you submit. Analysis results generated by
            the Service are for your use in accordance with these Terms.
          </p>

          <hr />

          <h2>8. Data and Privacy</h2>

          <p>
            Your use of the Service is also governed by our{' '}
            <a href="/privacy">Privacy Policy</a>. By using the Service, you consent to the
            practices described therein.
          </p>

          <h3>8.1 Data Processing</h3>
          <p>
            URLs and data you submit are processed in real-time through third-party AI
            providers. We do not persist your data beyond your active session.
          </p>

          <hr />

          <h2>9. Disclaimer of Warranties</h2>

          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>

          <p>WE DO NOT WARRANT THAT:</p>
          <ul>
            <li>The Service will be uninterrupted or error-free</li>
            <li>Analysis results will be accurate or produce desired outcomes</li>
            <li>Web scraping will succeed for all URLs</li>
            <li>Third-party AI services will remain available</li>
            <li>API cost estimates will match actual charges</li>
          </ul>

          <hr />

          <h2>10. Limitation of Liability</h2>

          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, SIGNAL X STUDIO SHALL NOT BE LIABLE FOR
            ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY
            LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY
            LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
          </p>
          <ul>
            <li>Your use or inability to use the Service</li>
            <li>API costs incurred through use of the Service</li>
            <li>Inaccuracies in analysis results</li>
            <li>Business decisions made based on Service outputs</li>
            <li>Claims from third parties regarding scraping activities</li>
            <li>Changes to third-party AI provider availability or pricing</li>
          </ul>

          <p>
            IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED ONE HUNDRED DOLLARS ($100).
          </p>

          <hr />

          <h2>11. Indemnification</h2>

          <p>
            You agree to indemnify, defend, and hold harmless Signal X Studio and its officers,
            directors, employees, and agents from any claims, damages, losses, liabilities,
            and expenses (including reasonable attorneys' fees) arising from:
          </p>
          <ul>
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your scraping activities and use of scraped data</li>
            <li>Your use of third-party API keys</li>
            <li>Claims from websites you analyze</li>
          </ul>

          <hr />

          <h2>12. Termination</h2>

          <p>
            We may terminate or suspend your access immediately, without prior notice, for
            any reason, including breach of these Terms.
          </p>

          <hr />

          <h2>13. Dispute Resolution</h2>

          <h3>13.1 Governing Law</h3>
          <p>
            These Terms are governed by the laws of the State of Illinois, United States,
            without regard to conflict of law principles.
          </p>

          <h3>13.2 Jurisdiction</h3>
          <p>
            Any legal action arising from these Terms shall be brought exclusively in the
            state or federal courts located in Illinois, and you consent to the personal
            jurisdiction of such courts.
          </p>

          <hr />

          <h2>14. General Provisions</h2>

          <h3>14.1 Entire Agreement</h3>
          <p>
            These Terms, together with the Privacy Policy, constitute the entire agreement
            between you and Signal X Studio regarding the Service.
          </p>

          <h3>14.2 Modifications</h3>
          <p>
            We reserve the right to modify these Terms at any time. Your continued use of
            the Service after changes become effective constitutes acceptance of the revised Terms.
          </p>

          <hr />

          <h2>15. Contact Us</h2>

          <p>If you have questions about these Terms, please contact us:</p>

          <p>
            <strong>Signal X Studio</strong><br />
            Email: hello@signalx.studio
          </p>

          <hr />

          <p><em>These Terms of Service are effective as of November 29, 2024.</em></p>
    </article>
  )
}
