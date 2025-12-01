import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Commerce Prompt Analyzer',
  description: 'Privacy Policy for Commerce Prompt Analyzer',
}

export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-neutral max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground"><strong>Last Updated:</strong> November 29, 2024</p>

          <p>
            Signal X Studio ("we," "our," or "us") operates the Commerce Prompt Analyzer
            (the "Service"). This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our Service.
          </p>

          <p>
            By using the Service, you agree to the collection and use of information in
            accordance with this policy.
          </p>

          <hr />

          <h2>1. Information We Collect</h2>

          <h3>1.1 Information You Provide</h3>
          <ul>
            <li><strong>E-commerce URLs:</strong> Category and product page URLs you submit for analysis</li>
            <li><strong>Competitive Data:</strong> Competitor URLs and benchmark information</li>
            <li><strong>Query Data:</strong> Search prompts and analysis parameters you configure</li>
          </ul>

          <h3>1.2 Information Collected Automatically</h3>
          <ul>
            <li><strong>Usage Data:</strong> Features used, analyses performed, time spent</li>
            <li><strong>API Cost Data:</strong> Token usage and associated costs across AI providers</li>
            <li><strong>Device Information:</strong> Browser type, operating system</li>
            <li><strong>Log Data:</strong> IP address, access times</li>
          </ul>

          <h3>1.3 Information Collected via Scraping</h3>
          <p>
            When you provide e-commerce URLs for analysis, the Service may scrape publicly
            available product catalog data from those URLs, including:
          </p>
          <ul>
            <li>Product names and descriptions</li>
            <li>Category structures and navigation</li>
            <li>Pricing and availability information</li>
          </ul>

          <hr />

          <h2>2. How We Use Your Information</h2>

          <p>We use collected information to:</p>
          <ul>
            <li>Analyze e-commerce category pages for Answer Engine visibility</li>
            <li>Generate customer search prompts for AI answer engines</li>
            <li>Provide competitive gap analysis and diagnostics</li>
            <li>Calculate and display API usage costs</li>
            <li>Improve the Service's analysis capabilities</li>
          </ul>

          <hr />

          <h2>3. Third-Party AI Services</h2>

          <p>
            <strong>Important:</strong> The Service sends your data to multiple AI providers
            for analysis. When you submit URLs or queries, they may be processed by:
          </p>
          <ul>
            <li><strong>Google Gemini:</strong> Primary AI analysis engine</li>
            <li><strong>OpenAI (GPT):</strong> Prompt generation and analysis</li>
            <li><strong>Anthropic (Claude):</strong> Analysis services</li>
            <li><strong>Perplexity:</strong> Search analysis</li>
            <li><strong>Tavily:</strong> Web search and competitor research</li>
          </ul>

          <p><strong>What this means for you:</strong></p>
          <ul>
            <li>URLs and e-commerce data you provide are sent to these AI providers</li>
            <li>Competitive analysis data is processed through these services</li>
            <li>We do not control how these providers handle data beyond our agreements with them</li>
            <li>Each provider has their own privacy policies governing data use</li>
          </ul>

          <h3>3.1 Data Sub-Processors</h3>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Purpose</th>
                <th>Data Processed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Google Gemini</td>
                <td>AI Analysis</td>
                <td>URLs, product data, queries</td>
              </tr>
              <tr>
                <td>OpenAI</td>
                <td>Prompt Generation</td>
                <td>Category data, search context</td>
              </tr>
              <tr>
                <td>Anthropic</td>
                <td>AI Analysis</td>
                <td>URLs, queries</td>
              </tr>
              <tr>
                <td>Perplexity</td>
                <td>Search Analysis</td>
                <td>Search queries</td>
              </tr>
              <tr>
                <td>Tavily</td>
                <td>Competitor Research</td>
                <td>URLs, competitor data</td>
              </tr>
            </tbody>
          </table>

          <hr />

          <h2>4. Web Scraping Practices</h2>

          <p>
            The Service includes web scraping functionality. By using this feature:
          </p>
          <ul>
            <li>You represent that you have authorization to analyze the URLs you submit</li>
            <li>Scraped data is used only for analysis within the Service</li>
            <li>We do not store scraped data beyond the duration of your analysis session</li>
            <li>You are responsible for ensuring your use complies with target sites' terms of service</li>
          </ul>

          <hr />

          <h2>5. Data Security</h2>

          <p>We implement appropriate measures to protect your information:</p>
          <ul>
            <li><strong>Encryption in Transit:</strong> All data is transmitted over HTTPS/TLS</li>
            <li><strong>API Key Security:</strong> Your API keys are stored locally and not transmitted to our servers</li>
            <li><strong>Session-Based:</strong> Analysis data is processed in real-time and not persisted</li>
          </ul>

          <hr />

          <h2>6. Data Retention</h2>

          <p>
            The Service is designed for real-time analysis. We do not persist your analysis
            data, URLs, or results beyond your active session unless you explicitly save them.
          </p>

          <hr />

          <h2>7. Your Rights</h2>

          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request information about data processing</li>
            <li><strong>Deletion:</strong> Clear your session data at any time</li>
            <li><strong>Control:</strong> Choose which AI providers to use</li>
          </ul>

          <p>For questions, contact us at hello@signalx.studio.</p>

          <h3>7.1 California Residents (CCPA)</h3>
          <p>
            If you are a California resident, you have additional rights under the California
            Consumer Privacy Act. We do not sell personal information to third parties.
          </p>

          <hr />

          <h2>8. Children's Privacy</h2>

          <p>
            The Service is not intended for children under 13 years of age. We do not knowingly
            collect personal information from children under 13.
          </p>

          <hr />

          <h2>9. Changes to This Policy</h2>

          <p>
            We may update this Privacy Policy from time to time. We will notify you of any
            changes by posting the new policy on this page and updating the "Last Updated" date.
          </p>

          <hr />

          <h2>10. Contact Us</h2>

          <p>If you have questions about this Privacy Policy, please contact us:</p>

          <p>
            <strong>Signal X Studio</strong><br />
            Email: hello@signalx.studio
          </p>

          <hr />

          <p><em>This Privacy Policy is effective as of November 29, 2024.</em></p>
    </article>
  )
}
