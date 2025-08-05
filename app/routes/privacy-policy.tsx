export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        Futebolada respects your privacy. This Privacy Policy explains how we
        collect, use, and protect your personal information.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        1. Information We Collect
      </h2>
      <p className="mb-4">
        When you sign in using third-party providers (e.g., Facebook, Google),
        we may collect:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Your name</li>
        <li>Your email address</li>
        <li>Your profile picture</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        2. How We Use Your Information
      </h2>
      <p className="mb-4">We use your data only to:</p>
      <ul className="list-disc list-inside mb-4">
        <li>Create and manage your user account</li>
        <li>Personalize your experience</li>
        <li>Improve the functionality of our service</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Sharing</h2>
      <p className="mb-4">
        We do <strong>not</strong> sell or share your personal data with third
        parties.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Security</h2>
      <p className="mb-4">
        We take reasonable measures to protect your personal data using secure
        technologies and best practices.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Data Deletion</h2>
      <p className="mb-4">
        You may request deletion of your data by contacting us at{" "}
        <a
          href="mailto:contact@futebolada.org"
          className="text-blue-600 underline"
        >
          contact@futebolada.org
        </a>
        .
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        6. Changes to This Policy
      </h2>
      <p className="mb-4">
        We may update this policy from time to time. Continued use of the
        service constitutes acceptance of the updated policy.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Contact</h2>
      <p>
        If you have any questions, email us at{" "}
        <a
          href="mailto:contact@futebolada.org"
          className="text-blue-600 underline"
        >
          contact@futebolada.org
        </a>
        .
      </p>
    </div>
  );
}
