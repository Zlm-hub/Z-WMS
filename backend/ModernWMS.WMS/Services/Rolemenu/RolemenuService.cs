/*
 * date：2022-12-20
 * developer：AMo
 */
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using ModernWMS.Core.DBContext;
using ModernWMS.Core.JWT;
using ModernWMS.Core.Models;
using ModernWMS.Core.Services;
using ModernWMS.Core.Utility;
using ModernWMS.WMS.Entities.Models;
using ModernWMS.WMS.Entities.ViewModels;
using ModernWMS.WMS.IServices;

namespace ModernWMS.WMS.Services
{
    /// <summary>
    ///  Rolemenu Service
    /// </summary>
    public class RolemenuService : BaseService<RolemenuEntity>, IRolemenuService
    {
        #region Args
        /// <summary>
        /// The DBContext
        /// </summary>
        private readonly SqlDBContext _dBContext;

        /// <summary>
        /// Localizer Service
        /// </summary>
        private readonly IStringLocalizer<Core.MultiLanguage> _stringLocalizer;
        #endregion

        #region constructor
        /// <summary>
        ///Rolemenu  constructor
        /// </summary>
        /// <param name="dBContext">The DBContext</param>
        /// <param name="stringLocalizer">Localizer</param>
        public RolemenuService(
            SqlDBContext dBContext
          , IStringLocalizer<ModernWMS.Core.MultiLanguage> stringLocalizer
            )
        {
            this._dBContext = dBContext;
            this._stringLocalizer = stringLocalizer;
        }
        #endregion

        #region Api
        /// <summary>
        /// Get all records
        /// </summary>
        /// <param name="currentUser">currentUser</param>
        /// <returns></returns>
        public async Task<List<RolemenuListViewModel>> GetAllAsync(CurrentUser currentUser)
        {
            var Rolemenus = _dBContext.GetDbSet<RolemenuEntity>();
            var Userroles = _dBContext.GetDbSet<UserroleEntity>();
            var queryMenusGroup = Rolemenus.AsNoTracking()
               .Where(t => t.tenant_id == currentUser.tenant_id)
               .GroupBy(g => new { g.userrole_id })
               .Select(g => new
               {
                   userrole_id = g.Key.userrole_id,
                   create_time = g.Min(t => t.create_time),
                   last_update_time = g.Max(t => t.last_update_time)
               });
            var data = await (from g in queryMenusGroup
                              join r in Userroles.AsNoTracking().Where(t => t.tenant_id == currentUser.tenant_id)
                              on g.userrole_id equals r.id
                              select new RolemenuListViewModel
                              {
                                  userrole_id = g.userrole_id,
                                  role_name = r.role_name,
                                  is_valid = r.is_valid,
                                  create_time = g.create_time,
                                  last_update_time = g.last_update_time
                              }).ToListAsync();
            return data;
        }

        /// <summary>
        /// Get a record by id
        /// </summary>
        /// <param name="userrole_id">userrole id</param>
        /// <returns></returns>
        public async Task<RolemenuBothViewModel> GetAsync(int userrole_id)
        {
            var Rolemenus = _dBContext.GetDbSet<RolemenuEntity>();
            var Userroles = _dBContext.GetDbSet<UserroleEntity>();
            var Menus = _dBContext.GetDbSet<MenuEntity>();
            var entities = await (from rm in Rolemenus.AsNoTracking()
                                  join m in Menus.AsNoTracking() on rm.menu_id equals m.id
                                  join r in Userroles.AsNoTracking() on rm.userrole_id equals r.id
                                  where rm.userrole_id == userrole_id
                                  orderby r.role_name, m.sort, m.menu_name
                                  select new
                                  {
                                      rm.id,
                                      rm.userrole_id,
                                      r.role_name,
                                      r.is_valid,
                                      rm.menu_id,
                                      m.menu_name,
                                      rm.authority,
                                      rm.menu_actions_authority,
                                      rm.create_time,
                                      rm.last_update_time
                                  }).ToListAsync();
            if (entities.Any())
            {
                var data = new RolemenuBothViewModel
                {
                    userrole_id = entities.First().userrole_id,
                    role_name = entities.First().role_name,
                    is_valid = entities.First().is_valid,
                    detailList = entities.Select(t => new RolemenuViewModel
                    {
                        id = t.id,
                        menu_id = t.menu_id,
                        menu_name = t.menu_name,
                        authority = t.authority,
                        menu_actions_authority = JsonHelper.DeserializeObject<List<string>>(t.menu_actions_authority)
                    }).ToList()
                };
                return data;
            }
            else
            {
                return new RolemenuBothViewModel();
            }
        }
        /// <summary>
        /// Get all menus
        /// </summary>
        /// <param name="currentUser">currentUser</param>
        /// <returns></returns>
        public async Task<List<MenuViewModel>> GetAllMenusAsync(CurrentUser currentUser)
        {
            var Menus = _dBContext.GetDbSet<MenuEntity>();
            var data = await Menus.AsNoTracking()
                .Where(t => t.tenant_id == currentUser.tenant_id)
                .Select(m => new 
                {
                    id = m.id,
                    menu_name = m.menu_name,
                    module = m.module,
                    vue_path = m.vue_path,
                    vue_path_detail = m.vue_path_detail,
                    vue_directory = m.vue_directory,
                    sort = m.sort,
                    menu_actions = m.menu_actions
                }).ToListAsync();

            var result = data.Select(m => new MenuViewModel
            {
                id = m.id,
                menu_name = m.menu_name,
                module = m.module,
                vue_path = m.vue_path,
                vue_path_detail = m.vue_path_detail,
                vue_directory = m.vue_directory,
                sort = m.sort,
                menu_actions = JsonHelper.DeserializeObject<List<string>>(m.menu_actions)
            }).ToList();
            return result;
        }
        /// <summary>
        /// Get menu's authority by user role id
        /// </summary>
        /// <param name="userrole_id">user role id</param>
        /// <returns></returns>
        public async Task<List<MenuViewModel>> GetMenusByRoleId(int userrole_id)
        {
            var Rolemenus = _dBContext.GetDbSet<RolemenuEntity>(); 
            var Menus = _dBContext.GetDbSet<MenuEntity>();
            var data = await (from rm in Rolemenus.AsNoTracking()
                              join m in Menus.AsNoTracking() on rm.menu_id equals m.id
                              where rm.userrole_id == userrole_id
                              orderby m.sort, m.menu_name
                              select new 
                              {
                                  id = m.id,
                                  menu_name = m.menu_name,
                                  module = m.module,
                                  vue_path = m.vue_path,
                                  vue_path_detail = m.vue_path_detail,
                                  vue_directory = m.vue_directory,
                                  sort = m.sort,
                                  rm.menu_actions_authority
                              }).ToListAsync();
            if (data.Any())
            {
                var result = data.Select(m => new MenuViewModel
                {
                    id = m.id,
                    menu_name = m.menu_name,
                    module = m.module,
                    vue_path = m.vue_path,
                    vue_path_detail = m.vue_path_detail,
                    vue_directory = m.vue_directory,
                    sort = m.sort,
                    menu_actions = JsonHelper.DeserializeObject<List<string>>(m.menu_actions_authority)
                }).ToList();
                return result;
            }
            return new List<MenuViewModel>();
        }

        /// <summary>
        /// get user role id by role name (used when only role name is present in JWT claims)
        /// </summary>
        /// <param name="role_name">role name</param>
        /// <param name="tenant_id">tenant id</param>
        /// <returns></returns>
        public async Task<int> GetRoleIdByRoleNameAsync(string role_name, long tenant_id)
        {
            if (string.IsNullOrWhiteSpace(role_name))
            {
                return 0;
            }
            var Userroles = _dBContext.GetDbSet<UserroleEntity>();
            var role = await Userroles.AsNoTracking()
                                      .FirstOrDefaultAsync(t => t.role_name == role_name && t.tenant_id == tenant_id);
            return role == null ? 0 : role.id;
        }

        /// <summary>
        /// get role name by user role id
        /// </summary>
        /// <param name="userrole_id">user role id</param>
        /// <param name="tenant_id">tenant id</param>
        /// <returns></returns>
        public async Task<string> GetRoleNameByIdAsync(int userrole_id, long tenant_id)
        {
            if (userrole_id <= 0)
            {
                return string.Empty;
            }
            var Userroles = _dBContext.GetDbSet<UserroleEntity>();
            var name = await Userroles.AsNoTracking()
                                      .Where(t => t.id == userrole_id && t.tenant_id == tenant_id)
                                      .Select(t => t.role_name)
                                      .FirstOrDefaultAsync();
            return name ?? string.Empty;
        }
        /// <summary>
        /// add a new record
        /// </summary>
        /// <param name="viewModel">viewmodel</param>
        /// <param name="currentUser">currentUser</param>
        /// <returns></returns>
        public async Task<(int id, string msg)> AddAsync(RolemenuBothViewModel viewModel, CurrentUser currentUser)
        {
            var Rolemenus = _dBContext.GetDbSet<RolemenuEntity>();
            if (await Rolemenus.AnyAsync(t => t.userrole_id.Equals(viewModel.userrole_id)))
            {
                return (0, string.Format(_stringLocalizer["exists_entity"], _stringLocalizer["role_name"], viewModel.role_name));
            }
            var entities = viewModel.detailList.Select(t => new RolemenuEntity
            {
                id = 0,
                userrole_id = viewModel.userrole_id,
                menu_id = t.menu_id,
                authority = t.authority,
                menu_actions_authority = JsonHelper.SerializeObject(t.menu_actions_authority),
                create_time = DateTime.Now,
                last_update_time = DateTime.Now,
                tenant_id = currentUser.tenant_id
            }).ToList();

            await Rolemenus.AddRangeAsync(entities);
            var qty = await _dBContext.SaveChangesAsync();
            if (qty > 0)
            {
                return (viewModel.userrole_id, _stringLocalizer["save_success"]);
            }
            else
            {
                return (0, _stringLocalizer["save_failed"]);
            }
        }
        /// <summary>
        /// update a record
        /// </summary>
        /// <param name="viewModel">args</param>
        /// <param name="currentUser">currentUser</param>
        /// <returns></returns>
        public async Task<(bool flag, string msg)> UpdateAsync(RolemenuBothViewModel viewModel, CurrentUser currentUser)
        {
            var Rolemenus = _dBContext.GetDbSet<RolemenuEntity>();
            var dbEntities = await Rolemenus.Where(t => t.userrole_id == viewModel.userrole_id).ToListAsync();

            // 以前这里按明细 id 关联，但前端整棵树勾选后提交的 id 恒为 0，
            // 导致「取消勾选的菜单不会被删、已存在的会被重复插入」。
            // 这里改为以 menu_id 为唯一键做全量对齐：进来的集合就是目标集合。
            var incoming = (viewModel.detailList ?? new List<RolemenuViewModel>())
                .Where(t => t.menu_id > 0)
                .GroupBy(t => t.menu_id)
                .Select(g => g.First())
                .ToList();
            var now = DateTime.Now;
            var added = 0;
            var updated = 0;
            foreach (var vm in incoming)
            {
                var db = dbEntities.FirstOrDefault(t => t.menu_id == vm.menu_id);
                if (db == null)
                {
                    await Rolemenus.AddAsync(new RolemenuEntity
                    {
                        userrole_id = viewModel.userrole_id,
                        menu_id = vm.menu_id,
                        authority = vm.authority,
                        menu_actions_authority = JsonHelper.SerializeObject(vm.menu_actions_authority ?? new List<string>()),
                        create_time = now,
                        last_update_time = now,
                        tenant_id = currentUser.tenant_id
                    });
                    added++;
                }
                else
                {
                    db.authority = vm.authority;
                    db.menu_actions_authority = JsonHelper.SerializeObject(vm.menu_actions_authority ?? new List<string>());
                    db.last_update_time = now;
                    updated++;
                    // 命中过的从待删集合里摘掉，剩下就是本次被取消勾选的
                    dbEntities.Remove(db);
                }
            }
            var removed = dbEntities.Count;
            if (removed > 0)
            {
                Rolemenus.RemoveRange(dbEntities);
            }
            // 即使 added/updated/removed 全为 0（用户没改动就点了保存）也算成功，否则前端会误报失败
            await _dBContext.SaveChangesAsync();
            if (added + updated + removed > 0)
            {
                return (true, string.Format("{0}（新增 {1} / 更新 {2} / 移除 {3}）", _stringLocalizer["save_success"], added, updated, removed));
            }
            else
            {
                return (true, _stringLocalizer["save_success"]);
            }
        }
        /// <summary>
        /// delete a record
        /// </summary>
        /// <param name="userrole_id">userrole id</param>
        /// <returns></returns>
        public async Task<(bool flag, string msg)> DeleteAsync(int userrole_id)
        {
            var qty = await _dBContext.GetDbSet<RolemenuEntity>().Where(t => t.userrole_id.Equals(userrole_id)).ExecuteDeleteAsync();
            if (qty > 0)
            {
                return (true, _stringLocalizer["delete_success"]);
            }
            else
            {
                return (false, _stringLocalizer["delete_failed"]);
            }
        }
        #endregion
    }
 }
 
