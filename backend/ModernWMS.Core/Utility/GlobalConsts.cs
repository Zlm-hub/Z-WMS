namespace ModernWMS.Core.Utility
{
    /// <summary>
    /// global constant
    /// </summary>
    public static class GlobalConsts
    {

        /// <summary>
        /// is Swagger enable
        /// </summary>
        public static bool IsEnabledSwagger = true;

        /// <summary>
        /// Is RequestResponseMiddleware enable
        /// </summary>
        public static bool IsRequestResponseMiddleware = true;

        /// <summary>
        /// token cipher — from env WMS_JWT_SIGNINGKEY, fallback to dev-only default (production MUST set the env var)
        /// </summary>
        public static readonly string SigningKey =
            Environment.GetEnvironmentVariable("WMS_JWT_SIGNINGKEY")
            ?? "ModernWMS_SigningKey";

        /// <summary>
        /// Password will expire every 30 days from last password change.
        /// </summary>
        public static int PasswordExpireDays = 30;


    }
}
