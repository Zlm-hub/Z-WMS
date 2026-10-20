
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ModernWMS.Core.JWT;
using ModernWMS.Core.Utility;
using System.Linq;

namespace ModernWMS.Core.Controller
{
    /// <summary>
    /// base controller
    /// </summary>
    // 全站接口默认要求登录：没有这一行时 HttpContext.User 永远不会被填充，
    // CurrentUser 会静默回落成默认 admin，角色权限（菜单过滤）也就完全失效。
    // 匿名接口（登录/刷新令牌/注册等）在各 action 上标 [AllowAnonymous]。
    [Authorize]
    [Produces("application/json")]
    public class BaseController : ControllerBase
    {
        /// <summary>
        /// current user
        /// </summary>
        public CurrentUser CurrentUser
        {
            get
            {
                if (User != null && User.Claims.ToList().Count > 0)
                {
                    var Claim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimValueTypes.Json);
                    return Claim == null ? new CurrentUser() : JsonHelper.DeserializeObject<CurrentUser>(Claim.Value) ?? new CurrentUser();
                }
                else
                {
                    return new CurrentUser();
                }
            }
        }

        public BaseController()
        {
        }
    }
}
