using ModernWMS.Core.DynamicSearch;

namespace ModernWMS.Core.Models
{
    /// <summary>
    /// PageSearch
    /// </summary>
    public class PageSearch
    {
        /// <summary>
        /// current page number
        /// </summary> 
        public int pageIndex { get; set; } = 1;

        /// <summary>
        /// rows per page
        /// </summary>
        public int pageSize { get; set; } = 20;

        /// <summary>
        /// Custom Classification
        /// </summary>
        public string sqlTitle { get; set; } = "";

        /// <summary>
        /// 关键词（多字段模糊匹配）。
        /// 上游只有 searchObjects/sqlTitle，没有这个字段 —— 前端列表页的关键词框一直在发，
        /// 后端从来收不到，等于所有列表页的搜索都是摆设。这里先补字段，由各列表页自行决定是否实现。
        /// </summary>
        public string searchValue { get; set; } = "";

        /// <summary>
        /// search condition
        /// </summary>
        public List<SearchObject> searchObjects { get; set; } = new List<SearchObject>();
    }
}
