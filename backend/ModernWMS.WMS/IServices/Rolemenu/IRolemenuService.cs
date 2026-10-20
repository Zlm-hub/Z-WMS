using ModernWMS.Core.JWT;
using ModernWMS.Core.Services;
using ModernWMS.WMS.Entities.Models;
using ModernWMS.WMS.Entities.ViewModels;

namespace ModernWMS.WMS.IServices
{
    /// <summary>
    /// Interface of RolemenuService
    /// </summary>
    public interface IRolemenuService : IBaseService<RolemenuEntity>
    {
        #region Api
        /// <summary>
        /// Get all records
        /// </summary>
        /// <param name="currentUser">currentUser</param>
        /// <returns></returns>
        Task<List<RolemenuListViewModel>> GetAllAsync(CurrentUser currentUser);

        /// <summary>
        /// Get a record by id
        /// </summary>
        /// <param name="userrole_id">userrole id</param>
        /// <returns></returns>
        Task<RolemenuBothViewModel> GetAsync(int userrole_id);

        /// <summary>
        /// add a new record
        /// </summary>
        /// <param name="viewModel">args</param>
        /// <param name="currentUser">currentUser</param>
        /// <returns></returns>
        Task<(int id, string msg)> AddAsync(RolemenuBothViewModel viewModel, CurrentUser currentUser);

        /// <summary>
        /// Get all menus
        /// </summary>
        /// <param name="currentUser">currentUser</param>
        /// <returns></returns>
        Task<List<MenuViewModel>> GetAllMenusAsync(CurrentUser currentUser);

        /// <summary>
        /// Get menu's authority by user role id
        /// </summary>
        /// <param name="userrole_id">user role id</param>
        /// <returns></returns>
        Task<List<MenuViewModel>> GetMenusByRoleId(int userrole_id);

        /// <summary>
        /// get user role id by role name
        /// </summary>
        /// <param name="role_name">role name</param>
        /// <param name="tenant_id">tenant id</param>
        /// <returns></returns>
        Task<int> GetRoleIdByRoleNameAsync(string role_name, long tenant_id);

        /// <summary>
        /// get role name by user role id
        /// </summary>
        /// <param name="userrole_id">user role id</param>
        /// <param name="tenant_id">tenant id</param>
        /// <returns></returns>
        Task<string> GetRoleNameByIdAsync(int userrole_id, long tenant_id);

        /// <summary>
        /// update a record
        /// </summary>
        /// <param name="viewModel">args</param>
        /// <param name="currentUser">currentUser</param>
        /// <returns></returns>
        Task<(bool flag, string msg)> UpdateAsync(RolemenuBothViewModel viewModel, CurrentUser currentUser);

        /// <summary>
        /// delete a record
        /// </summary>
        /// <param name="userrole_id">userrole id</param>
        /// <returns></returns>
        Task<(bool flag, string msg)> DeleteAsync(int userrole_id);
        #endregion
    }
}
