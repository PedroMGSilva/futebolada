export default function FacebookDataDeletion() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6">
        Facebook Data Deletion Instructions
      </h1>

      <p className="mb-4">
        If you want to delete your data associated with the Futebolada app,
        follow these steps:
      </p>

      <ol className="list-decimal list-inside mb-6 space-y-2">
        <li>
          Go to your Facebook account’s{" "}
          <a
            href="https://www.facebook.com/settings?tab=applications"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Settings & Apps
          </a>
          .
        </li>
        <li>
          Find and select the <strong>Futebolada</strong> app.
        </li>
        <li>
          Click <strong>Remove</strong> to delete your connection and associated
          data.
        </li>
      </ol>

      <p className="mb-4">
        Alternatively, you may contact us directly to request data deletion at:{" "}
        <a
          href="mailto:contact@futebolada.org"
          className="text-blue-600 underline"
        >
          contact@futebolada.org
        </a>
        .
      </p>

      <p className="text-sm text-gray-500">
        This page serves as the data deletion callback required by Facebook.
      </p>
    </div>
  );
}
