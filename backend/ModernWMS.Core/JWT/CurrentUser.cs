using System.ComponentModel.DataAnnotations;
using System.Xml.Linq;

namespace ModernWMS.Core.JWT
{
    /// <summary>
    /// CurrentUser
    /// </summary>
    public class CurrentUser
    {
        /// <summary>
        /// user_id
        /// </summary>
        public int user_id { get; set; } = 1;

        /// <summary>
        /// user_num
        /// </summary>
        public string user_num { get; set; } = "admin";

        /// <summary>
        /// user_name
        /// </summary>
        public string user_name { get; set; } = "admin";

        /// <summary>
        /// user_role
        /// </summary>
        public string user_role { get; set; } = "admin";

        /// <summary>
        /// userrole_id（角色主键，登录时一并写入 token —— 权限/菜单按它过滤，比按角色名查更可靠）
        /// 旧 token 里没有这个字段时为 0，调用方需按 user_role 名字回退查找
        /// </summary>
        public int userrole_id { get; set; } = 0;

        /// <summary>
        /// tenant
        /// </summary>
        public long tenant_id { get; set; } = 1;
    }
}