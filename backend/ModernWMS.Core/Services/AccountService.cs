using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using ModernWMS.Core.Models;
using System.Linq;
using ModernWMS.Core.Utility;
using System.Data;
using Mapster;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using ModernWMS.Core.DBContext;
using Microsoft.Extensions.Localization;
using ModernWMS.Core.JWT;

namespace ModernWMS.Core.Services
{
    /// <summary>
    /// AccountService
    /// </summary>
    public class AccountService : IAccountService
    {
        private readonly SqlDBContext _sqlDBContext;
        private readonly IStringLocalizer<ModernWMS.Core.MultiLanguage> _stringLocalizer;

        public AccountService(SqlDBContext sqlDBContext, IStringLocalizer<ModernWMS.Core.MultiLanguage> stringLocalizer
)
        {
            _sqlDBContext = sqlDBContext;
            _stringLocalizer = stringLocalizer;
        }

        /// <summary>
        /// login
        /// </summary>
        /// <param name="loginInput"> login params viewmodel</param>
        /// <param name="currentUser"> current user</param>
        /// <returns></returns>
        public async Task<LoginOutputViewModel> Login(LoginInputViewModel loginInput, CurrentUser currentUser)
        {
            var users = await (from user in _sqlDBContext.GetDbSet<userEntity>().AsNoTracking()
                                                join ur in _sqlDBContext.GetDbSet<UserroleEntity>().AsNoTracking() on user.user_role equals ur.role_name
                                                where ur.tenant_id == user.tenant_id&&(user.user_name == loginInput.user_name || user.user_num == loginInput.user_name)
                                                select new  {
                                                    user_id = user.id,
                                                    user_num = user.user_num,
                                                    user_name = user.user_name,
                                                    user_role = user.user_role,
                                                    userrole_id = ur.id,
                                                    cipher = user.auth_string,
                                                    tenant_id = user.tenant_id
                                                }
                                               ).ToListAsync();
            // PBKDF2 first, legacy md5/plain values still accepted (auto-upgraded on successful login)
            var result = users.FirstOrDefault(t => PasswordHelper.Verify(loginInput.password, t.cipher));
            if(result!= null)
            {
                // one-time upgrade: rewrite legacy stored value as PBKDF2
                if (!PasswordHelper.IsPbkdf2(result.cipher))
                {
                    var userSet = _sqlDBContext.GetDbSet<userEntity>();
                    var tracked = await userSet.FirstOrDefaultAsync(t => t.id == result.user_id);
                    if (tracked != null)
                    {
                        tracked.auth_string = PasswordHelper.Hash(loginInput.password);
                        tracked.last_update_time = DateTime.Now;
                        await _sqlDBContext.SaveChangesAsync();
                    }
                }
                return new LoginOutputViewModel()
                {
                    user_id = result.user_id,
                    user_name = result.user_name,
                    user_num = result.user_num,
                    user_role = result.user_role,
                    userrole_id = result.userrole_id,
                    tenant_id= result.tenant_id,
                };
            }
            return null;
        }
        
        public string HelloWorld ()
        {
            return _stringLocalizer["hello word"];
        }

    }

}
