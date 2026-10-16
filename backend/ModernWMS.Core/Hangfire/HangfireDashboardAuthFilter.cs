using Hangfire.Dashboard;
using Microsoft.Extensions.Primitives;
using System;
using System.Net;
using System.Text;

namespace ModernWMS.Core.Utility
{
    /// <summary>
    /// authorization filter for the Hangfire dashboard.
    /// - if env WMS_HANGFIRE_USER / WMS_HANGFIRE_PASS are set: HTTP Basic auth is required
    /// - otherwise: only local (loopback) requests are allowed
    /// </summary>
    public class HangfireDashboardAuthFilter : IDashboardAuthorizationFilter
    {
        private readonly string _user;
        private readonly string _pass;

        public HangfireDashboardAuthFilter()
        {
            _user = Environment.GetEnvironmentVariable("WMS_HANGFIRE_USER");
            _pass = Environment.GetEnvironmentVariable("WMS_HANGFIRE_PASS");
        }

        public bool Authorize(DashboardContext context)
        {
            var http = context.GetHttpContext();

            // basic auth mode
            if (!string.IsNullOrEmpty(_user) && !string.IsNullOrEmpty(_pass))
            {
                var auth = http.Request.Headers["Authorization"];
                if (!StringValues.IsNullOrEmpty(auth) && auth.ToString().StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(auth.ToString().Substring(6)));
                        var idx = decoded.IndexOf(':');
                        if (idx >= 0
                            && decoded.Substring(0, idx) == _user
                            && decoded.Substring(idx + 1) == _pass)
                        {
                            return true;
                        }
                    }
                    catch (FormatException)
                    {
                        // fall through
                    }
                }
                var resp = http.Response;
                resp.StatusCode = (int)HttpStatusCode.Unauthorized;
                resp.Headers["WWW-Authenticate"] = "Basic realm=\"Hangfire Dashboard\"";
                return false;
            }

            // no credentials configured: local requests only
            return http.Connection.RemoteIpAddress is { } ip
                && (IPAddress.IsLoopback(ip) || ip.Equals(IPAddress.IPv6Loopback));
        }
    }
}
