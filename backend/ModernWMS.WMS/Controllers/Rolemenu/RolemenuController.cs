/*
 * date：2022-12-20
 * developer：AMo
 */
 using Microsoft.AspNetCore.Mvc;
 using ModernWMS.Core.Controller;
 using ModernWMS.Core.Models;
 using ModernWMS.WMS.Entities.ViewModels;
 using ModernWMS.WMS.IServices;
 using Microsoft.Extensions.Localization;
 
 namespace ModernWMS.WMS.Controllers
 {
    /// <summary>
    /// rolemenu controller
    /// </summary>
    [Route("rolemenu")]
    [ApiController]
    [ApiExplorerSettings(GroupName = "Base")]
    public class RolemenuController : BaseController
    {
        #region Args

        /// <summary>
        /// rolemenu Service
        /// </summary>
        private readonly IRolemenuService _rolemenuService;

        /// <summary>
        /// Localizer Service
        /// </summary>
        private readonly IStringLocalizer<ModernWMS.Core.MultiLanguage> _stringLocalizer;
        #endregion

        #region constructor
        /// <summary>
        /// constructor
        /// </summary>
        /// <param name="rolemenuService">rolemenu Service</param>
        /// <param name="stringLocalizer">Localizer</param>
        public RolemenuController(
            IRolemenuService rolemenuService
          , IStringLocalizer<ModernWMS.Core.MultiLanguage> stringLocalizer
            )
        {
            this._rolemenuService = rolemenuService;
            this._stringLocalizer = stringLocalizer;
        }
        #endregion

        #region Api
        /// <summary>
        /// 当前登录用户的角色 id：优先取 token 里的 userrole_id，旧 token（无该字段）回退按角色名查
        /// </summary>
        private async Task<int> GetCurrentRoleIdAsync()
        {
            var role_id = CurrentUser.userrole_id;
            if (role_id <= 0)
            {
                role_id = await _rolemenuService.GetRoleIdByRoleNameAsync(CurrentUser.user_role, CurrentUser.tenant_id);
            }
            return role_id;
        }

        /// <summary>
        /// 当前用户是否被授予「角色权限」菜单（拿它当"能管理角色权限"的判据，避免越权改别人的权限）
        /// </summary>
        private async Task<bool> CanManageRoleMenuAsync()
        {
            var role_id = await GetCurrentRoleIdAsync();
            if (role_id <= 0)
            {
                return false;
            }
            var menus = await _rolemenuService.GetMenusByRoleId(role_id);
            return menus.Any(m => m.menu_name == "roleMenu");
        }
        /// <summary>
        /// 超级管理员角色名（其权限不可通过界面修改，避免把自己锁在系统外）
        /// </summary>
        private const string SUPER_ADMIN_ROLE_NAME = "admin";

        /// <summary>
        /// 目标角色是否为超级管理员角色
        /// </summary>
        private async Task<bool> IsSuperAdminRoleAsync(int userrole_id)
        {
            if (userrole_id <= 0)
            {
                return false;
            }
            var role_name = await _rolemenuService.GetRoleNameByIdAsync(userrole_id, CurrentUser.tenant_id);
            return string.Equals((role_name ?? string.Empty).Trim(), SUPER_ADMIN_ROLE_NAME, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Get menu's authority by user role id
        /// </summary>
        /// <param name="userrole_id">user role id</param>
        /// <returns></returns>
        [HttpGet("authority")]
        public async Task<ResultModel<List<MenuViewModel>>> GetMenusByRoleId(int userrole_id = 0)
        {
            // 不传 userrole_id 时按当前登录用户的角色过滤（侧边栏/动态路由用这个口径）
            var own_role_id = await GetCurrentRoleIdAsync();
            if (userrole_id <= 0 || userrole_id != own_role_id && !await CanManageRoleMenuAsync())
            {
                // 非「角色权限」管理员只能看自己角色的菜单，防止 ?userrole_id=1 越权读全量
                userrole_id = own_role_id;
            }
            var data = await _rolemenuService.GetMenusByRoleId(userrole_id);
            if (data.Any())
            {
                return ResultModel<List<MenuViewModel>>.Success(data);
            }
            else
            {
                return ResultModel<List<MenuViewModel>>.Success(new List<MenuViewModel>());
            }
        }
        /// <summary>
        /// get all records
        /// </summary>
        /// <returns>args</returns>
        [HttpGet("all")]
        public async Task<ResultModel<List<RolemenuListViewModel>>> GetAllAsync()
        {
            var data = await _rolemenuService.GetAllAsync(CurrentUser);
            if (data.Any())
            {
                return ResultModel<List<RolemenuListViewModel>>.Success(data);
            }
            else
            {
                return ResultModel<List<RolemenuListViewModel>>.Success(new List<RolemenuListViewModel>());
            }
        }
        /// <summary>
        /// Get all menus
        /// </summary>
        /// <returns></returns>
        [HttpGet("menus")]
        public async Task<ResultModel<List<MenuViewModel>>> GetAllMenusAsync()
        {
            var data = await _rolemenuService.GetAllMenusAsync(CurrentUser);
            if (data.Any())
            {
                return ResultModel<List<MenuViewModel>>.Success(data);
            }
            else
            {
                return ResultModel<List<MenuViewModel>>.Success(new List<MenuViewModel>());
            }
        }
        /// <summary>
        /// get a record by id
        /// </summary>
        /// <returns>args</returns>
        [HttpGet]
        public async Task<ResultModel<RolemenuBothViewModel>> GetAsync(int userrole_id)
        {
            var data = await _rolemenuService.GetAsync(userrole_id);
            if (data != null && data.userrole_id > 0)
            {
                return ResultModel<RolemenuBothViewModel>.Success(data);
            }
            else
            {
                return ResultModel<RolemenuBothViewModel>.Error(_stringLocalizer["not_exists_entity"]);
            }
        }
        /// <summary>
        /// add a new record
        /// </summary>
        /// <param name="viewModel">args</param>
        /// <returns></returns>
        [HttpPost]
        public async Task<ResultModel<int>> AddAsync(RolemenuBothViewModel viewModel)
        {
            if (!await CanManageRoleMenuAsync())
            {
                return ResultModel<int>.Error("Sorry, you don't have the authority required!", 403, 0);
            }
            if (await IsSuperAdminRoleAsync(viewModel.userrole_id))
            {
                return ResultModel<int>.Error("超级管理员(admin)角色的权限不可修改", 403, 0);
            }
            var (id, msg) = await _rolemenuService.AddAsync(viewModel, CurrentUser);
            if (id > 0)
            {
                return ResultModel<int>.Success(id);
            }
            else
            {
                return ResultModel<int>.Error(msg);
            }
        }

        /// <summary>
        /// update a record
        /// </summary>
        /// <param name="viewModel">args</param>
        /// <returns></returns>
        [HttpPut]
        public async Task<ResultModel<bool>> UpdateAsync(RolemenuBothViewModel viewModel)
        {
            if (!await CanManageRoleMenuAsync())
            {
                return ResultModel<bool>.Error("Sorry, you don't have the authority required!", 403, false);
            }
            if (await IsSuperAdminRoleAsync(viewModel.userrole_id))
            {
                return ResultModel<bool>.Error("超级管理员(admin)角色的权限不可修改", 403, false);
            }
            var (flag, msg) = await _rolemenuService.UpdateAsync(viewModel, CurrentUser);
            if (flag)
            {
                return ResultModel<bool>.Success(flag);
            }
            else
            {
                return ResultModel<bool>.Error(msg, 400, flag);
            }
        }

        /// <summary>
        /// delete a record
        /// </summary>
        /// <param name="userrole_id">userrole id</param>
        /// <returns></returns>
        [HttpDelete]
        public async Task<ResultModel<string>> DeleteAsync(int userrole_id)
        {
            if (!await CanManageRoleMenuAsync())
            {
                return ResultModel<string>.Error("Sorry, you don't have the authority required!", 403, string.Empty);
            }
            if (await IsSuperAdminRoleAsync(userrole_id))
            {
                return ResultModel<string>.Error("超级管理员(admin)角色的权限不可修改", 403, string.Empty);
            }
            var (flag, msg) = await _rolemenuService.DeleteAsync(userrole_id);
            if (flag)
            {
                return ResultModel<string>.Success(msg);
            }
            else
            {
                return ResultModel<string>.Error(msg);
            }
        }
        #endregion

    }
 }
 
