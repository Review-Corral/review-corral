export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 mt-16">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy for Review Corral</h1>

      <p className="text-sm text-gray-600 mb-8 italic">
        Last Updated: December 20, 2024
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="mb-4">
          Review Corral ("we," "our," or "us") is committed to protecting the privacy of
          users ("you" or "your") who access and use our Slack bot. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your information when
          you use Review Corral.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>

        <h3 className="text-xl font-medium mb-3">
          Information Automatically Collected
        </h3>
        <p className="mb-3">When you use Review Corral, we automatically collect:</p>
        <ul className="list-disc pl-6 mb-6">
          <li className="mb-2">Slack workspace ID and channel information</li>
          <li className="mb-2">
            Message content and metadata related to code review requests and responses
          </li>
          <li className="mb-2">User IDs of participants in code review discussions</li>
          <li className="mb-2">Timestamps of interactions with the bot</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">Information You Provide</h3>
        <p className="mb-3">
          We collect information that you voluntarily provide when:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Configuring Review Corral for your Slack workspace</li>
          <li className="mb-2">Submitting code review requests</li>
          <li className="mb-2">Responding to code review notifications</li>
          <li className="mb-2">Interacting with bot commands and features</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
        <p className="mb-3">We use the collected information to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">
            Facilitate code review processes within your Slack workspace
          </li>
          <li className="mb-2">
            Send notifications and reminders about pending reviews
          </li>
          <li className="mb-2">Generate metrics and reports about review activity</li>
          <li className="mb-2">Improve our bot's functionality and user experience</li>
          <li className="mb-2">Troubleshoot technical issues and provide support</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Storage and Security</h2>
        <p className="mb-4">
          We implement appropriate technical and organizational security measures to
          protect your information. Your data is stored securely on cloud servers with
          industry-standard encryption. We retain your data only for as long as
          necessary to provide our services and comply with legal obligations.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Sharing and Disclosure</h2>
        <p className="mb-3">
          We do not sell, rent, or trade your personal information. We may share your
          information only in the following circumstances:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">With your explicit consent</li>
          <li className="mb-2">To comply with legal obligations</li>
          <li className="mb-2">To protect our rights, privacy, safety, or property</li>
          <li className="mb-2">In connection with a business transfer or merger</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
        <p className="mb-3">You have the right to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Access the data we hold about you</li>
          <li className="mb-2">Request correction of inaccurate data</li>
          <li className="mb-2">Request deletion of your data</li>
          <li className="mb-2">Opt out of certain data collection features</li>
          <li className="mb-2">Export your data in a machine-readable format</li>
        </ul>
        <p>
          To exercise these rights, please contact us using the information provided
          below.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. We will notify users of
          any material changes through Slack or email. Your continued use of Review
          Corral after such modifications constitutes acceptance of the updated Privacy
          Policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
        <p className="mb-4">
          If you have questions or concerns about this Privacy Policy, please{" "}
          <a href="mailto:alex.mclean25+reviewcorral@gmail.com">
            <span className="underline">contact us</span>.
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
        <p className="mb-4">
          Review Corral operates through Slack and may integrate with other third-party
          services. Please review the privacy policies of these services, as we are not
          responsible for their privacy practices.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
        <p className="mb-4">
          Review Corral is not intended for use by individuals under the age of 13. We
          do not knowingly collect personal information from children under 13.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
        <p className="mb-4">
          If you use Review Corral from outside the United States, please be aware that
          your information may be transferred to, stored, and processed in the United
          States where our servers are located.
        </p>
      </section>
    </div>
  );
}
