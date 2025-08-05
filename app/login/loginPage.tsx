import googleIcon from "./google-icon.png";
import facebookIcon from "./facebook-icon.png";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="shadow-md rounded-lg p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">Sign in to Futebolada</h1>

        <div className="space-y-4">
          <a
            href="/auth/google"
            className="w-full inline-block bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition"
          >
            <div className="flex items-center justify-center gap-2">
              <img src={googleIcon} alt="Google" className="w-5 h-5" />
              <span>Continue with Google</span>
            </div>
          </a>

          <a
            href="/auth/facebook"
            className="w-full inline-block bg-[#1877F2] text-white py-2 px-4 rounded-md hover:bg-[#145DBF] transition"
          >
            <div className="flex items-center justify-center gap-2">
              <img
                src={facebookIcon}
                alt="Facebook"
                className="w-5 h-5 rounded-sm"
              />
              <span>Continue with Facebook</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
