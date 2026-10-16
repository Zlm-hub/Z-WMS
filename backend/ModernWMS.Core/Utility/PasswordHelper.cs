using Microsoft.AspNetCore.Http;
using System;
using System.Security.Cryptography;

namespace ModernWMS.Core.Utility
{
    /// <summary>
    /// password hashing helper (PBKDF2-HMAC-SHA256)
    /// stored format: PBKDF2$<iterations>$<salt_base64>$<hash_base64>
    /// legacy values (md5 32-char hex or plain text) are verified for backward compatibility
    /// </summary>
    public static class PasswordHelper
    {
        private const int Iterations = 100_000;
        private const int SaltSize = 16;
        private const int HashSize = 32;
        private const string Prefix = "PBKDF2";

        /// <summary>
        /// hash a plain password with PBKDF2
        /// </summary>
        public static string Hash(string password)
        {
            if (string.IsNullOrEmpty(password))
            {
                throw new ArgumentNullException(nameof(password));
            }
            byte[] salt = new byte[SaltSize];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }
            byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, HashSize);
            return $"{Prefix}${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
        }

        /// <summary>
        /// verify a plain password against a stored value.
        /// supports new PBKDF2 format and legacy (md5 hex / plain text) values
        /// </summary>
        public static bool Verify(string password, string stored)
        {
            if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(stored))
            {
                return false;
            }
            if (stored.StartsWith(Prefix + "$", StringComparison.Ordinal))
            {
                var parts = stored.Split('$');
                if (parts.Length != 4 || !int.TryParse(parts[1], out var iterations))
                {
                    return false;
                }
                try
                {
                    byte[] salt = Convert.FromBase64String(parts[2]);
                    byte[] expected = Convert.FromBase64String(parts[3]);
                    byte[] actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
                    return CryptographicOperations.FixedTimeEquals(actual, expected);
                }
                catch (FormatException)
                {
                    return false;
                }
            }
            // legacy: md5 32-char hex or historical plain-text values
            string md5 = Md5Helper.Md5Encrypt32(password);
            return stored == md5 || stored == password;
        }

        /// <summary>
        /// whether the stored value already uses the new PBKDF2 format
        /// </summary>
        public static bool IsPbkdf2(string stored)
        {
            return !string.IsNullOrEmpty(stored) && stored.StartsWith(Prefix + "$", StringComparison.Ordinal);
        }
    }
}
