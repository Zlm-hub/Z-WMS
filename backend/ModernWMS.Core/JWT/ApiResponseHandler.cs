
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Text.Encodings.Web;
using Microsoft.Extensions.Logging;
using ModernWMS.Core.Models;
using System.Linq;
using ModernWMS.Core.Utility;
using ModernWMS.Core.JWT;
namespace ModernWMS.Core.JWT
{
    /// <summary>
    /// Custom Processing Unit
    /// </summary>
    public class ApiResponseHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {

        /// <summary>
        /// token manager
        /// </summary>
        private readonly ITokenManager _tokenManager;
        /// <summary>
        /// cache manager
        /// </summary>
        private readonly CacheManager _cacheManager;

        /// <summary>
        /// constructor 
        /// </summary>
        /// <param name="options">options</param>
        /// <param name="logger">logger</param>
        /// <param name="encoder">encoder</param>
        /// <param name="clock"></param>
        /// <param name="tokenManager">tokenManager</param>
        /// <param name="cacheManager">cacheManagerparam>
        public ApiResponseHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder, ISystemClock clock
            , ITokenManager tokenManager
            , CacheManager cacheManager)
            : base(options, logger, encoder, clock)
        {
            this._tokenManager = tokenManager;
            _cacheManager = cacheManager;
        }
        /// <summary>
        /// handle authority
        /// </summary>
        /// <returns></returns>
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var raw = Request.Headers["Authorization"].ObjToString();
            if (string.IsNullOrWhiteSpace(raw))
            {
                // 未携带令牌：给 challenge 机会返回 401，绝不能落回默认身份（原实现在此直接抛 NotImplementedException）
                return Task.FromResult(AuthenticateResult.NoResult());
            }
            var token = raw.Replace("Bearer ", "").Trim();
            if (token.Length == 0)
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }
            CurrentUser currentUser;
            try
            {
                // 验签用 GlobalConsts.SigningKey（可被 WMS_JWT_SIGNINGKEY 环境变量覆盖），与签发侧保持一致
                currentUser = _tokenManager.GetCurrentUser(token);
            }
            catch (Exception)
            {
                // 令牌被篡改 / 结构非法 / 缺 Json 声明，一律视为未登录
                return Task.FromResult(AuthenticateResult.Fail("Sorry, please sign in first!"));
            }
            if (currentUser == null || string.IsNullOrWhiteSpace(currentUser.user_num))
            {
                return Task.FromResult(AuthenticateResult.Fail("Sorry, please sign in first!"));
            }
            // 与原版契约一致：整份用户信息序列化后塞进 ClaimValueTypes.Json 声明，
            // BaseController.CurrentUser 就从这里取，角色权限（user_role）才能生效。
            var claims = new List<Claim>
            {
                new Claim(ClaimValueTypes.Json, JsonHelper.SerializeObject(currentUser), ClaimValueTypes.Json)
            };
            var identity = new ClaimsIdentity(claims, Scheme.Name);
            var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
        /// <summary>
        /// authentication
        /// </summary>
        /// <param name="properties">参数</param>
        /// <returns></returns>
        protected override async Task HandleChallengeAsync(AuthenticationProperties properties)
        {
            Response.ContentType = "application/json";
            Response.StatusCode = StatusCodes.Status401Unauthorized;
            await Response.WriteAsync(JsonHelper.SerializeObject(ResultModel<object>.Error("Sorry, please sign in first!", 403)));
        }
        /// <summary>
        /// access denied
        /// </summary>
        /// <param name="properties"></param>
        /// <returns></returns>
        protected override async Task HandleForbiddenAsync(AuthenticationProperties properties)
        {
            Response.ContentType = "application/json";
            Response.StatusCode = StatusCodes.Status403Forbidden;
            await Response.WriteAsync(JsonHelper.SerializeObject(ResultModel<object>.Error("Sorry, you don't have the authority required!", 403)));
        }
    }
}
