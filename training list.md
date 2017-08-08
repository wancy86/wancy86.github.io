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
|Table Name                          |Table Name                          |Table Name                         |
|:-----------------------------------|:-----------------------------------|:----------------------------------|  
|PolicyQuote                         |System_CompanyTree_Attachments      |System_Premiums_Levels             |  
|PolicyQuote_AddIns                  |System_CompanyTree_Bank             |WrittenPremium_Levels              |  
|PolicyQuote_AdditionalInterest      |System_CompanyTree_BusinessAbility  |WrittenPremium                     |  
|PolicyQuote_Answers                 |System_CompanyTree_Data             |System_Reports                     |  
|PolicyQuote_Stops                   |System_Constants                    |System_Rights                      |  
|PolicyData                          |System_Countries                    |System_RoleRights                  |  
|PolicyData_Bills                    |System_DataCollections              |System_Roles                       |  
|Policy_Documents                    |System_Forms                        |System_Rules                       |  
|PayPlans_Lines                      |System_Holidays                     |System_ScheduleTypes               |  
|PayPlans                            |System_Images                       |System_Sessions                    |  
|Ledger_AccTransTypes                |System_Language_Translations        |System_States                      |  
|Ledger_AccountTypes                 |System_LOBs                         |System_Stops                       |  
|System_AH_Params                    |System_NavButtons                   |System_TempVar                     |  
|System_Attachments                  |System_Parameters                   |System_UserAgencies                |  
|System_Attachments_Categories       |System_PolicyTabs                   |System_UserRights                  |  
|System_Billing                      |System_PolicyTerms                  |System_UserRoles                   |  
|System_Commissions                  |System_PolicyTransactions           |System_Users                       |  
|System_CompanyTree                  |System_Premiums                     |DTS_ScheduleTask                   |  

##### 2. 非常用表
|Table Name                                  |Table Name                                  |Table Name   
|:-------------------------------------------|:------------------------------------|:----------------------------|                                              
|System_AC_Reports                           |System_Errors                        |System_Questions             |
|System_AH_Reports                           |System_ExportImportSetting           |System_QuoteCopy_Data        |
|System_Attachments_Codes                    |System_FileUpload_Params             |System_QuoteCopy_Tables      |
|System_BusinessRules                        |System_Forms_Tables                  |System_RatingTables          |
|System_CategoryReports                      |System_History_Commissions           |System_RatingTables_History  |
|System_CC_Types                             |System_History_CompanyTree           |System_ReportCategories      |
|System_CheckStacks                          |System_History_CompanyTree_Bank      |System_Reports_Params        |
|System_ClaimsLimits                         |System_History_CompTree_Data         |System_ReportTypes           |
|System_Codes                                |System_History_Forms_CheckLimits     |System_Rules_Hashes          |
|System_CompanyLevels                        |System_History_RoleRights            |System_Schemes               |
|System_CompanyTree_Attachments_BillType     |System_History_Roles                 |System_Schemes_Colors        |
|System_CompanyTree_Attachments_LicenseType  |System_History_UserReportCategories  |System_SecurityQuestions     |
|System_CompanyTree_BankAccType              |System_History_UserRights            |System_SMS_Providers         |
|System_CompanyTree_Individual               |System_History_UserRoles             |System_State_City_Zips       |
|System_CompanyTree_Notes                    |System_History_Users                 |System_StaticFiles           |
|System_CompanyTree_NotesRelated             |System_History_Users_Data            |System_TableReference        |
|System_CompanyTree_NotesSubj                |System_History_UsersPassw            |System_TCUnsafeSet           |
|System_CompanyTree_Status                   |System_Holidays_Temp                 |System_TempLanguage          |
|System_CompanyTree_Type                     |System_Images_AG                     |System_TWFilters             |
|System_CoreLanguages                        |System_Insured_Logins                |System_User_Colors           |
|System_CustomerCare_Features                |System_Insured_Logins_Actions        |System_UserReportCategories  |
|System_Data                                 |System_Insured_Logins_Policies       |System_Users_Data            |
|System_DataCollections_Archive              |System_Languages                     |System_Users_Questions       |
|System_DataCopy_Data                        |System_Logging                       |System_Users_TravelStates    |
|System_DataCopy_Tables                      |System_MailPaymentsTo                |System_Versions              |
|System_DataTypes                            |System_Merchant_Constants            |System_WebServers            |
|System_DevModeEmails                        |System_MimeTypes                     |System_WelcomeMsgs           |
|System_DropDowns                            |System_NavExtension                  |System_WelcomeMsgs_Temp      |
|System_DTS_SysCheck                         |System_PasswordRules                 |System_WSLogs                |
|System_DTS_SysCheckLog                      |System_PaymentTypes                  |System_ZipCodeRestrictions   |

