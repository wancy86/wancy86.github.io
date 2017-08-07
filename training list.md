# 任务列表

### 开发环境配置
1. 【基础】sublime text的基本使用技巧，插件的安装
1. 【基础】sql server management studio，代码提示插件的安装和使用
1. 【基础】blue tool的使用，理解并能熟练使用所有组件。
1. 【基础】chrome开发者工具的使用，能够熟练的调试代码、查找问题
1. 【基础】web editor的使用，熟练的使用html组件实现页面布局

### Stingray+SPA系统原理
1. 【基础】理解单页应用的原理, 我们系统是如何实现的、代码如何加载如何执行
1. 【基础】如何添加一个VRM文件
1. 【基础】CustomScript对象的产生过程
1. 【基础】html组件中condition、definition、function的理解和使用
1. 【基础】html组件中filter、param、dtype的理解和使用
1. 【基础】filter: 前端数据验证的理解和使用
1. 【基础】VRM文件pre和post的区别
1. 【基础】VRM文件间传递参数有哪些方式
1. 【基础】Communication对象三类请求的理解和熟练使用，VRM如何处理这三类请求
1. 【基础】系统中发送ajax可以有哪些方式
1. 【基础】ajax获取数据、编辑并保存的最佳实践(使用$extender.js中的param方法，将json数据呈现到编辑区域)
1. 【基础】tablewalker的基本结构和实现原理，如何用代码刷新一个tablewalker，如何传递额外的参数
1. 【基础】日期控件的使用
1. 【基础】Navbutton的实现原理和配置使用
1. 【基础】VRM中如何实现数据查询，如何实现增删改，如何实现for循环，如何实现if分支判断，如何设置变量
1. 【基础】常用的js对象的了解: GlobalScript, Global, Utilities
1. 【基础】如何添加全局的js方法，如何添加全局的自执行js代码
1. 【进阶】DTS的原理、作用和基本使用，如何配置任务
1. 【进阶】pacal语法的基本了解
1. 【进阶】文件上传(比较特殊，逻辑集成到stingray中了，对应的VRM是system_fileupload_handle.vrm)
1. 【进阶】文件下载(静态report文件的下载)
1. 【进阶】excel导入数据(现在数据模板，填写数据，上传导入)


### 业务逻辑
1. 概念：quote, policy, Full Quote, Endorsement Quote, Renew Quote, Endorsement, New Business, 
1. 概念：premium, fee, written premium, annual premium, additional premium, coverage, insured
1. 概念：Effective Date,Expiration Date, Inception Date, Bind Date, Rate Date, Accounting Date, Equity Date
1. Quote字段：PQ_CurrentRecord ,sPTRM_ID,sPTRN_ID,Is_Renewal, PQ_OrigPolicyCode, PQ_OrigPolicyID,sLOB_ID,sFRM_ID,PC_ContactCode
1. Policy字段：PD_TransOrder
1. 如何新增一个用户，添加权限
1. 如何新增一个Agency，并配置业务范围
1. 如何创建一个quote
1. 什么是stop，hard stop和soft stop的区别，如何实现的
1. 从quote绑定成policy的过程是怎么样的，数据有怎么样的变化
1. 付款过程是怎样的，数据有怎么样的变化
1. 从policy重建endorsement quote的过程是怎么样的，数据有怎么样的变化
1. 概念：Bill Pay Plan, Down Payment, Installment, Bill
1. 什么是work flow，如何实现的
1. 概念：Renewal, Cancel Policy, Reinstate
1. 手动和自动Renew Policy过程是怎样的
1. 手动和自动Cancel Policy过程是怎样的
1. Reinstate Cancellation过程是怎样的
1. Cancel Rewrite过程是怎样的


### 数据库
##### 1. 常用表
1. PolicyQuote
1. PolicyQuote_AddIns
1. PolicyQuote_AdditionalInterest
1. PolicyQuote_Answers
1. PolicyQuote_Stops
1. PolicyData
1. PolicyData_Bills
1. Policy_Documents
1. PayPlans_Lines
1. PayPlans
1. Ledger_AccTransTypes
1. Ledger_AccountTypes
1. System_AH_Params
1. System_Attachments
1. System_Attachments_Categories
1. System_Billing
1. System_Commissions
1. System_CompanyTree
1. System_CompanyTree_Attachments
1. System_CompanyTree_Bank
1. System_CompanyTree_BusinessAbility
1. System_CompanyTree_Data
1. System_Constants
1. System_Countries
1. System_DataCollections
1. System_Forms
1. System_Holidays
1. System_Images
1. System_Language_Translations
1. System_LOBs
1. System_NavButtons
1. System_Parameters
1. System_PolicyTabs
1. System_PolicyTerms
1. System_PolicyTransactions
1. System_Premiums
1. System_Premiums_Levels
1. WrittenPremium_Levels
1. WrittenPremium
1. System_Reports
1. System_Rights
1. System_RoleRights
1. System_Roles
1. System_Rules
1. System_ScheduleTypes
1. System_Sessions
1. System_States
1. System_Stops
1. System_TempVar
1. System_UserAgencies
1. System_UserRights
1. System_UserRoles
1. System_Users
1. DTS_ScheduleTask

##### 2. 非常用表
1. System_AC_Reports
1. System_AH_Reports
1. System_Attachments_Codes
1. System_BusinessRules
1. System_CategoryReports
1. System_CC_Types
1. System_CheckStacks
1. System_ClaimsLimits
1. System_Codes
1. System_CompanyLevels
1. System_CompanyTree_Attachments_BillType
1. System_CompanyTree_Attachments_LicenseType
1. System_CompanyTree_BankAccType
1. System_CompanyTree_Individual
1. System_CompanyTree_Notes
1. System_CompanyTree_NotesRelated
1. System_CompanyTree_NotesSubj
1. System_CompanyTree_Status
1. System_CompanyTree_Type
1. System_CoreLanguages
1. System_CustomerCare_Features
1. System_Data
1. System_DataCollections_Archive
1. System_DataCopy_Data
1. System_DataCopy_Tables
1. System_DataTypes
1. System_DevModeEmails
1. System_DropDowns
1. System_DTS_SysCheck
1. System_DTS_SysCheckLog
1. System_Errors
1. System_ExportImportSetting
1. System_FileUpload_Params
1. System_Forms_Tables
1. System_History_Commissions
1. System_History_CompanyTree
1. System_History_CompanyTree_Bank
1. System_History_CompTree_Data
1. System_History_Forms_CheckLimits
1. System_History_RoleRights
1. System_History_Roles
1. System_History_UserReportCategories
1. System_History_UserRights
1. System_History_UserRoles
1. System_History_Users
1. System_History_Users_Data
1. System_History_UsersPassw
1. System_Holidays_Temp
1. System_Images_AG
1. System_Insured_Logins
1. System_Insured_Logins_Actions
1. System_Insured_Logins_Policies
1. System_Languages
1. System_Logging
1. System_MailPaymentsTo
1. System_Merchant_Constants
1. System_MimeTypes
1. System_NavExtension
1. System_PasswordRules
1. System_PaymentTypes
1. System_Questions
1. System_QuoteCopy_Data
1. System_QuoteCopy_Tables
1. System_RatingTables
1. System_RatingTables_History
1. System_ReportCategories
1. System_Reports_Params
1. System_ReportTypes
1. System_Rules_Hashes
1. System_Schemes
1. System_Schemes_Colors
1. System_SecurityQuestions
1. System_SMS_Providers
1. System_State_City_Zips
1. System_StaticFiles
1. System_TableReference
1. System_TCUnsafeSet
1. System_TempLanguage
1. System_TWFilters
1. System_User_Colors
1. System_UserReportCategories
1. System_Users_Data
1. System_Users_Questions
1. System_Users_TravelStates
1. System_Versions
1. System_WebServers
1. System_WelcomeMsgs
1. System_WelcomeMsgs_Temp
1. System_WSLogs
1. System_ZipCodeRestrictions


