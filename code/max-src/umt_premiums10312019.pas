unit umt_premiums;

//LK: Please use Currency types for all amount values!

interface

uses
  SysUtils, Classes, dialogs, DBXpress, SQLExpr, Math, umt_aplus, logging_utils;

const
  cSysPrem = 'System_Premiums';
  cSysPremLvls = 'System_Premiums_Levels';
  cSysPolTrans = 'System_PolicyTransactions';
  cNoQuotes = '(''FQ'', ''QQ'', ''EQ'', ''RQ'')';
  iInactiveFlag = -987.654;
  sInactiveFlag = '-987.654';

  LongTransactionStrings: array[0..17] of string = (
    'Unknown', 'Quick Quote', 'Full Quote', 'Endorsement Quote', 'Renewal Quote',
    'New Business', 'Endorsement', 'Cancellation', 'Reinstatement', 'Renewal',
    'Cancel/Rewrite', 'Pending Renewal', 'Void New Business', 'Void Endorsement',
    'Void Cancellation', 'Void Reinstatment', 'Void Renewal', 'Void Pending Renewal'
  );

  ShortTransactionStrings: array[0..17] of string = (
    'NA', 'QQ', 'FQ', 'EQ', 'RQ', 'NB', 'EN', 'CN', 'RI', 'RN', 'CR', 'PRN', 'VNB', 'VEN', 'VCN', 'VRI', 'VRN', 'VPR'
  );

type
  TTransactionType = (NA, QQ, FQ, EQ, RQ, NB, EN, CN, RI, RN, CR, PRN, VNB, VEN, VCN, VRI, VRN, VPR);

  // Main configuration
  TPremium_Params = record
    LOBID,
    FRMID,
    UseSQLCalc: integer;
    PolicyCode,
    PremiumName,
    DebugLog: string;
    PremiumDate: TDateTime; //LK! TODO: Confusingly similar to fCalcDate!
  end;

  // Calculated transaction amounts
  TSegment = record
    Written_Premium: currency;
    Written_Fees: currency;
    Written_RoundAdj: currency;
    Written_Factor: double;
    ProRate_Factor: double;
    Earned_Premium: currency;
    Earned_Fees: currency;
    Earned_RoundAdj: currency; //17174
    Unearned_Premium: currency;
    Unearned_Fees: currency;
    Days_Earned: integer;
    Daily_Earned: currency;
    Short_Rate: currency; //19079
    Visible: boolean;
  end;

  // Policy transaction
  TTransaction = record
    PolicyID: integer;
    PremiumID: Int64; // MUST be bigger than integer!
    Line_Num: Integer;
    Inception_Date: TDateTime;
    Expiration_Date: TDateTime;
    Entry_Date: TDateTime;
    Notes: string;
    WrittenTotal: currency; // Used by level's MinRetainedWP
    LineID: integer; // To track transaction's level line it belongs to

    //LK: Moved from old THistory
    TrnType: TTransactionType;
    Effective_Date: TDateTime;
    Accounting_Date: TDateTime;
    Fees: Currency;
    BasePremium: Currency;
    MinRetainedWPAmt: currency;
    ShortRatePerc: double; //19079      //LK: shouldn't be integer?
    MinWPAmt: currency; //19079         //LK: was double
    ForcedWPAmt: currency; //65358      //LK: was double
    SetEarnDateOld: boolean; //25934
    DaysTOEarn: integer;
    AccDays: integer;
    ProRataDiff: double;
    FeeDiff: currency;                  //LK: was double
    TotalAdj: currency;                 //LK: was double
    Value: currency;                    //LK: was double

    Segment: TSegment;

    DoRemove: boolean;
  end;
  TTransactions = array of TTransaction;

  // Coverage configuration
  TCoverage = record
    RecID: integer;
    Name: string;
    WPTableName: string;
    EPTableName: string;
    RoundWpTo: double;
    RoundEpTo: double; //28093
    CalculationType: integer; //1 - regular prorata (default), 2 - prorata by ratio #18868
    WP_Mandatory: boolean; //24728
    EP_Mandatory: boolean; //24728
    PD_AsFunct: boolean; //27464
    RunWPSum: currency; //36132
    RunEPSum: currency; //36132
    CalcRuleName: string; //51102
    ProRateRoundTo: double; //LKPRORATE
    ProRateEffDate: TDateTime; //LKPRORATE
    Inception_Date: TDateTime;
    Expiration_Date: TDateTime;
    WrittenTotal: currency; // Used by level's MinRetainedWP
    FullyEarn: boolean;

    Totals: TSegment;
    Transactions: TTransactions;

    // Not needed by the new SQL calulator!
    PolicyIDName: string;
    EntryDateName: string;
    EffDateName: string;
    AccDateName: string;
    IncDateName: string;
    ExpDateName: string;
    TransNoteName: string;
    PremiumName: string;
    FeeName: string;
    MinRetainedWPAmtName: string;
    ShortRatePercName: string; //19079
    MinWPAmtName: string; //19079
    ForcedWPAmtName: string; //65358
    EP_ErnDateOptName: string; //25934
    TableName: string;
    PolicyCodeName: string;
    TransStatName: string;
    TransOrdName: string;
  end;
  TCoverages = array of TCoverage;

  //
  TEarning = record
    Amounts: array of Extended;
    Days: array of TDateTime;
  end;
  TEarnings = array of TEarning;

  //19002 - Coverage level configuration
  TLvlCoverage = record
    PRL_ID: integer;
    Level_Name: string;
    Premium_Name: string;

    WP_Table: string;

    PD_Table: string;
    PD_TransStat_Name: string;
    PD_ID_Name: string;
    PD_PolicyCodeName: string;
    PD_EntryDate_Name: string;
    PD_IncDate_Name: string;
    PD_EffDate_Name: string;
    PD_ExpDate_Name: string;
    PD_AccDate_Name: string;
    PD_ShortRatePercName: string;
    PD_MinWPAmtName: string;
    PD_ForcedWPAmtName: string;
    PD_MinRetainedWPAmtName: string;

    PS_Table: string;
    PS_AsFunct: boolean;
    PS_PolID_Name: string;
    PS_ID_Name: string;
    PS_PolicyCodeName: string;
    PS_Prem_Name: string;
    PS_Fee_Name: string;
    PS_Deleted_Name: string;
    PS_LevelRecID: string; //25493

    WPL_TableName: string;
    EPL_TableName: string;
    WPL_Mandatory: boolean; //#24728
    EPL_Mandatory: boolean; //#24728

    RoundWpTo: Double;
    RoundEpTo: Double; //28093
    ProRateRoundTo: double; //LKPRORATE
    ProRateEffDate: TDateTime; //LKPRORATE
    FullyEarn: boolean;

    EP_ErnDateOptName: string; //#25934
  end;
  TLvlCoverages = array of TLvlCoverage;

  // Risk / Level
  TLevel = record
    Index: integer;
    WPL_TableName: string;
    EPL_TableName: string;
    RunWPSum: currency; //36132
    RunEPSum: currency; //36132

    Coverages: TLvlCoverages;
  end;
  TLevels = array of TLevel;

  //19002 - Level's transactions
  TLine = record
    LevelIndex: integer;
    WPL_ID: Int64; // MUST be bigger than integer;
    EPL_ID: Int64; // MUST be bigger than integer;
    PolID: integer;
    FrmID: integer;
    PolicyCode: string;
    WrtPremID: Int64; // MUST be bigger than integer;
    Line_Num: integer;
    Level_Name: string;
    TrnType: TTransactionType;
    Level: integer;
    PRL_ID: integer;
    DeletedSR: boolean;
    InactiveLevelRec: boolean; //25439
    MinRetainedWPAmt: currency;
    ShortRatePerc: double; //38615
    MinWPAmt: currency; //38615
    ForcedWPAmt: currency; //65358
    Inception_Date: TDateTime;
    Expiration_Date: TDateTime;
    Effective_Date: TDateTime;
    Entry_Date: TDateTime;
    Accounting_Date: TDateTime;

    PremSourceID: integer;
    AnnualPremium: Currency;
    AnnualFees: Currency;
    WrittenTotal: currency; // Used by level's MinRetainedWP

    Segment: TSegment;

    RoundWpTo: double;
    RoundEpTo: Double; //28093
    ProRateRoundTo: double; //LKPRORATE
    ProRateEffDate: TDateTime; //LKPRORATE
    FullyEarn: boolean;

    WPL_TableName: string;
    EPL_TableName: string;
    WPL_Mandatory: boolean; //#24728
    EPL_Mandatory: boolean; //#24728
    SetEarnDateOld: boolean; //25934
    LevelRecID: string; //25493
  end;
  TLines = array of TLine;

  //Custom premium function data #37519
  TPremiumEntryRecord = record
    InceptionDate,
    ExpirationDate,
    TransType,
    EffectiveDate,
    AccountingDate,
    FullyEarnedPrem,
    ProratedPrem,
    ShortRatePerc,
    WPRoundTo,
    EPRoundTo,
    MinWPAmt,
    ForcedWPAmt,
    MinRetainedWPAmt,
    ProRateRoundTo,//LKPRORATE
    ProRateEffDate: string; //LKPRORATE
    UseEarnDateOld: integer;
  end;
  TPremDataEntry = array of TPremiumEntryRecord;

  //Custom premium function data #37519
  TPremiumResultRecord = record
    WrittenPrem,
    WrittenFees,
    WPShortRate,
    WrittenFactor,
    ProRateFactor,
    EarnedPrem,
    EarnedFees,
    UnearnPrem,
    UnearnFees,
    DailyEarned,
    WPRoundAdj,
    EPRoundAdj: string;
    DaysEarned,
    Visible: integer;
  end;
  TPremDataResult = array of TPremiumResultRecord;

  TMax_Premium = class(TComponent)
  private
    fSQLConnection: TSQLConnection;
    fLog: TFileLogger;
    fDebugCache: TStringList;
    fParams: TPremium_Params;
    fCalcDate: TDateTime; //LK! TODO: Confusingly similar to PremiumDate!
    fPolicyDays: integer;
    fPolicyExpirationDate: TDateTime;
    fPolicyInceptionDate: TDateTime;
    fIgnoreLeapYear: boolean;
    fProRateRoundTo: double;
    fRoundWpTo: double;
    fRoundEpTo: double;
    fWithAdditionalTransaction: boolean;
    fDoMinRetainedWP: boolean;
    fCoverages: TCoverages;
    fCalcType: integer; //#18868
    fAddRecID: integer;

    function  GetCalculationType: integer;
    function  GetCalculationCase(var spName: string): integer;
    function  LoadCoverage(Q1: TSQLQuery): TCoverage;
    function  LoadCoverages: boolean;
    function  LoadTransaction(Q1: TSQLQuery): TTransaction;
    function  LoadTransactions: boolean;
    function  LoadCoveragesWithTransactions: boolean;
    function  UpdateWithNewProRatedFactor(var currTrn, prevTrn: TTransaction): double;
    function  RemoveFlaggedTransactions(var Trans: TTransactions): boolean;
    function  AddCoverage(coverage: TCoverage): integer;
    function  GetCoverage(index: integer): TCoverage;
    function  AddTransaction(covIdx: integer; var transaction: TTransaction): integer;
    function  MakeTempTableName: string;
    function  GetAllCoverageTotals(calcDate: TDateTime): TSegment;
    function  CalculateCoveragePremium(coverageIdx: integer): TCoverage;

    procedure Clear;
    procedure UpdateCoverageTotals(var coverage: TCoverage);
    procedure RoundEarnedPremiums(var cvg: TCoverage);
    procedure RoundWrittenPremium(var seg: TSegment);
    procedure ApplyMinRetainedWP;
    procedure ApplyLevelMinRetainedWP(var cvg: TCoverage);
    procedure Debug(msg: string; data: string = ''; id: string = '');
    procedure DropTempTable(tableName: string);
    procedure SaveWrittPremLevelTemp(line: TLine; TempTableName, WPLTableName: string);
    procedure SaveEarnedPremLevelTemp(line: TLine; TempTableName, EPLTableName: string);
    procedure LoadCalcWPResults(var coverage: TCoverage);
    procedure LoadCalcEPResults(var coverage: TCoverage);
  public
    constructor Create(params: TPremium_Params);
    destructor  Destroy; override;

    function StringToTransactionType(const InputString: string): TTransactionType;
  published
    property SQLConnection: TSQLConnection read FSQLConnection write FSQLConnection;
    property Coverages: TCoverages read fCoverages;

    function GetEarnedPremiumByPolicyCode(const calcDate: TDateTime; addRecID: integer = 0): Boolean;
    function GetCoverages(addRecID: integer = 0): TCoverages;
    function UpdatePremiumByLevel(var totals: TSegment; RecID, addRecID: integer; calcDate: TDateTime; updateDB: boolean): boolean;
    function UpdateEarnedPremiumByLevel(const calcDate: TDateTime; const RecID: integer = 0): boolean;
  end;

// Scripting exposed functions
function UpdateWrittenPremium(const LOBID: integer; const PolicyCode: string; const SQLConnection: TSQLConnection): boolean;
function UpdateWrittenPremiumEx(params: TPremium_Params; const SQLConnection: TSQLConnection): boolean;
function UpdateEarnedPremium(const LOBID: integer; const PolicyCode: string; const PremiumDate: TDateTime; const SQLConnection: TSQLConnection): boolean;
function UpdateEarnedPremiumEx(const params: TPremium_Params; const PremiumDate: TDateTime; const SQLConnection: TSQLConnection): boolean;
function EarnedPremiumByDate(const LineOB: integer; const PolicyCode: string; const calcDate: TDateTime; const SQLConnection: TSQLConnection; var FReqList: TStringList): boolean;
function EarnedPremiumByDateEx(const params: TPremium_Params; const calcDate: TDateTime; const SQLConnection: TSQLConnection; var FReqList: TStringList): boolean;
function GetWrittenPremiumRec(const LOBID: integer; const PolicyCode: string; const SQLConnection: TSQLConnection; const GetRecordID: integer; const AddRecordID: integer; var FReqList: TStringList): boolean;
function GetWrittenPremiumRecEx(const params: TPremium_Params; const SQLConnection: TSQLConnection; const GetRecordID: integer; const AddRecordID: integer; var FReqList: TStringList): boolean;

function UpdateWrittenPremiumLevel(const FrmID: integer; const PolicyCode: string; const SQLConnection: TSQLConnection): boolean;
function UpdateWrittenPremiumLevelEx(const params: TPremium_Params; const SQLConnection: TSQLConnection): boolean;
function UpdateEarnedPremiumLevel(const FrmID: integer; const PolicyCode: string; const calcDate: TDateTime; const SQLConnection: TSQLConnection): boolean;
function UpdateEarnedPremiumLevelEx(const params: TPremium_Params; const calcDate: TDateTime; const SQLConnection: TSQLConnection): boolean;
function EarnedPremiumLevelByDateEx(const params: TPremium_Params; const calcDate: TDateTime; const SQLConnection: TSQLConnection; var FReqList: TStringList): boolean;
function GetWrittenPremiumLevelRecEx(const params: TPremium_Params; const SQLConnection: TSQLConnection; const GetRecordID: integer; const AddRecordID: integer; var FReqList: TStringList): boolean;

function GetPaidToDate(const LOBID: integer; const PolicyCode, TransType: string; const AccTotalAmount, BalanceAmount: double; const IncDate, EffDate, ExpDate: TdateTime; const AddRecordID: integer; const SQLConnection: TSQLConnection): TDateTime;
function GetPaidToDateEx(const params: TPremium_Params; const TransType: string; const AccTotalAmount, BalanceAmount: double; const IncDate, EffDate, ExpDate: TdateTime; const AddRecordID: integer; const SQLConnection: TSQLConnection): TDateTime;
function CustomPremiumCalculator(const CalcDate: TDateTime; const CalculationType: integer; var ErrMsg: string; var RunningWPSum, RunningEPSum: double; PremEntryData: TPremDataEntry): TPremDataResult; //#37519





implementation

uses
  Scripting, DB, uPSUtils, Common_Utils, DateUtils, SqlTimSt, umt_transmanager, strUtils;

procedure Register;
begin
  RegisterComponents('MT', [TMax_Premium]);
end;

function currToStr(value: currency): string;
begin
  result := FormatCurr('0.0#########', value);
end;

function floatToStr(value: double): string;
begin
  result := FormatFloat('0.0#########', value);
end;

function boolToStr(value: Boolean): string;
const
  cBoolStrs: array [boolean] of String = ('false', 'true');
begin
  result := cBoolStrs[value];
end;

procedure printStr(l: TStringList; name: string; value: string; show: boolean = false; inactiveValue: string = '');
begin
  if show or (value <> inactiveValue) then
    l.Values[name] := value;
end;

procedure printInt(l: TStringList; name: string; value: Integer; show: boolean = false; inactiveValue: Integer = 0);
begin
  if show or (value <> inactiveValue) then
    l.Values[name] := IntToStr(value);
end;

procedure printDat(l: TStringList; name: string; value: TDateTime; show: boolean = false; inactiveValue: TDateTime = 0);
begin
  if show or (value <> inactiveValue) then
    l.Values[name] := DateTimeToStr(value);
end;

procedure printCur(l: TStringList; name: string; value: currency; show: boolean = false; inactiveValue: currency = 0);
begin
  if show or (value <> inactiveValue) then
    l.Values[name] := currToStr(value);
end;

procedure printDbl(l: TStringList; name: string; value: Double; show: boolean = false; inactiveValue: Double = 0);
begin
  if show or (value <> inactiveValue) then
    l.Values[name] := FloatToStr(value);
end;

procedure printBol(l: TStringList; name: string; value: Boolean);
begin
  l.Values[name] := boolToStr(value);
end;

function transTypeToString(const trnType: TTransactionType): string;
var
  i: integer;
begin
  i := Ord(trnType);
  result := ShortTransactionStrings[i];
end;

function strToTransType(const InputString: string): TTransactionType;
{
 Function: Returns the TransactionType for the inputstring given.
 Notes: The input string passed into this function can be the LONG or the SHORT version.
}
var
  Count, Count2: integer;
  Temp_Type: TTransactionType;
  Trans_Type: string;
begin
  //Define Lowest value while we loop
  Temp_Type := Low(Temp_Type);
  Count2 := ord(Temp_Type);

  //Uppercase the string so we don't do it in the loop over and over again...
  Trans_Type := FastUpperCase(InputString);

  //Look through the strings to find the proper position...
  for Count := Low(LongTransactionStrings) to High(LongTransactionStrings) do begin

    //Check against the long descriptions
    if FastUpperCase(LongTransactionStrings[Count]) = Trans_Type then break;

    //Check against the short descriptions
    if FastUpperCase(ShortTransactionStrings[Count]) = Trans_Type then break;

    //Increment the type
    Temp_Type := Succ(Temp_Type);

    //update Count2 to be able to tell if we went out of bounds...
    Inc(Count2);
  end; // For...

  //if we went out of bounds above then Count2 will be > High(...)
  if Count2 > High(LongTransactionStrings) then
    //Return the invalid string type...
    Result := Low(Temp_Type)
  else
    //Return the Ordinal value @ break location
    Result := Temp_Type;
end;

function serializeQueryParams(Q: TSqlQuery): string;
var
  l: TStringList;
  i: integer;
begin
  l := TStringList.Create;
  try
    for i := 0 to Q.Params.Count - 1 do
      l.Values[Q.Params.Items[i].Name] := Q.Params.Items[i].AsString;

    result := l.Text;
  finally
    l.Free;
  end;
end;

function getBlankPremiumParams: TPremium_Params;
begin
  result.LOBID := -1;
  result.FRMID := -1;
  result.UseSQLCalc := 0;
  result.PolicyCode := '';
  result.PremiumName := '';
  result.DebugLog := '';
  result.PremiumDate := 0;
end;

function getBlankSegment: TSegment;
begin
  result.Written_Premium := 0;
  result.Written_Fees := 0;
  result.Written_RoundAdj := 0;
  result.Written_Factor := 0;
  result.Earned_Premium := 0;
  result.Earned_Fees := 0;
  result.Earned_RoundAdj := 0;
  result.Unearned_Premium := 0;
  result.Unearned_Fees := 0;
  result.Days_Earned := 0;
  result.Daily_Earned := 0;
  result.ProRate_Factor := 0;
  result.Short_Rate := 0;
  result.Visible := True;
end;

function getBlankTransaction: TTransaction;
begin
  result.PolicyID := 0;
  result.PremiumID := 0;
  result.Line_Num := 0; // Index is calculated later
  result.LineID := 0;
  result.Inception_Date := 0;
  result.Expiration_Date := 0;
  result.Entry_Date := 0;
  result.Notes := '';
  result.WrittenTotal := 0;

  result.TrnType := NA;
  result.Effective_Date := 0;
  result.Accounting_Date := 0;
  result.Fees := 0;
  result.BasePremium := 0;
  result.MinRetainedWPAmt := 0;
  result.ShortRatePerc := 0;
  result.MinWPAmt := 0;
  result.ForcedWPAmt := iInactiveFlag;
  result.SetEarnDateOld := false;
  result.DaysTOEarn := 0;
  result.AccDays := 0;
  result.ProRataDiff := 0;
  result.FeeDiff := 0;
  result.TotalAdj := 0;
  result.Value := 0;

  result.Segment := getBlankSegment;
  result.DoRemove := false;
end;

function getBlankCoverage: TCoverage;
begin
  result.RecID := 0;
  result.Name := '';
  result.WPTableName := '';
  result.EPTableName := '';
  result.RoundWpTo := 0;
  result.RoundEpTo := 0;
  result.CalculationType := 1;
  result.WP_Mandatory := false;
  result.EP_Mandatory := false;
  result.PD_AsFunct := false;
  result.RunWPSum := 0;
  result.RunEPSum := 0;
  result.CalcRuleName := '';
  result.ProRateRoundTo := 0;
  result.ProRateEffDate := 0;
  result.Inception_Date := 0;
  result.Expiration_Date := 0;
  result.WrittenTotal := 0;
  result.FullyEarn := false;

  result.Totals := getBlankSegment;
  SetLength(result.Transactions, 0);

  // Not needed by the new SQL calulator!
  result.PolicyIDName := '';
  result.EntryDateName := '';
  result.EffDateName := '';
  result.AccDateName := '';
  result.IncDateName := '';
  result.ExpDateName := '';
  result.TransNoteName := '';
  result.PremiumName := '';
  result.FeeName := '';
  result.MinRetainedWPAmtName := '';
  result.ShortRatePercName := '';
  result.MinWPAmtName := '';
  result.ForcedWPAmtName := '';
  result.EP_ErnDateOptName := '';
  result.TableName := '';
  result.PolicyCodeName := '';
  result.TransStatName := '';
  result.TransOrdName := '';
end;

function serializeConfig(rec: TPremium_Params): string;
var
  l: TStringList;
begin
  l := TStringList.Create;
  try
    printInt(l, 'LOBID', rec.LOBID, true);
    printInt(l, 'FRMID', rec.FRMID, true);
    printStr(l, 'PolicyCode', rec.PolicyCode, true);
    printStr(l, 'PremiumName', rec.PremiumName, true);
    printDat(l, 'PremiumDate', rec.PremiumDate, true);
    printInt(l, 'UseSQLCalc', rec.UseSQLCalc, true);

    result := l.Text;
  finally
    l.Free;
  end;
end;

function serializeCoverage(rec: TCoverage): string;
var
  l: TStringList;
begin
  l := TStringList.Create;
  try
    printInt(l, 'RecID', rec.RecID, true);
    printStr(l, 'Name', rec.Name, true);
    printStr(l, 'TableName', rec.TableName);
    printStr(l, 'PolicyIDName', rec.PolicyIDName);
    printStr(l, 'PolicyCodeName', rec.PolicyCodeName);
    printStr(l, 'EntryDateName', rec.EntryDateName);
    printStr(l, 'EffDateName', rec.EffDateName);
    printStr(l, 'AccDateName', rec.AccDateName);
    printStr(l, 'IncDateName', rec.IncDateName);
    printStr(l, 'ExpDateName', rec.ExpDateName);
    printStr(l, 'TransStatName', rec.TransStatName);
    printStr(l, 'TransOrdName', rec.TransOrdName);
    printStr(l, 'TransNoteName', rec.TransNoteName);
    printStr(l, 'PremiumName', rec.PremiumName);
    printStr(l, 'FeeName', rec.FeeName);
    printStr(l, 'WPTableName', rec.WPTableName);
    printStr(l, 'EPTableName', rec.EPTableName);
    printDbl(l, 'RoundWpTo', rec.RoundWpTo);
    printDbl(l, 'RoundEpTo', rec.RoundEpTo); //28093
    printInt(l, 'CalculationType', rec.CalculationType); //1 - regular prorata (default), 2 - prorata by ratio #18868
    printStr(l, 'MinRetainedWPAmtName', rec.MinRetainedWPAmtName);
    printStr(l, 'ShortRatePercName', rec.ShortRatePercName); //19079
    printStr(l, 'MinWPAmtName', rec.MinWPAmtName); //19079
    printStr(l, 'ForcedWPAmtName', rec.ForcedWPAmtName); //65358
    printBol(l, 'WP_Mandatory', rec.WP_Mandatory); //#24728
    printBol(l, 'EP_Mandatory', rec.EP_Mandatory); //#24728
    printStr(l, 'EP_ErnDateOptName', rec.EP_ErnDateOptName); //#25934
    printBol(l, 'PD_AsFunct', rec.PD_AsFunct); //27464
    printCur(l, 'RunWPSum', rec.RunWPSum); //#36132
    printCur(l, 'RunEPSum', rec.RunEPSum); //#36132
    printStr(l, 'CalcRuleName', rec.CalcRuleName); //#51102
    printDbl(l, 'ProRateRoundTo', rec.ProRateRoundTo); //LKPRORATE
    printDat(l, 'ProRateEffDate', rec.ProRateEffDate); //LKPRORATE
    printDat(l, 'Inception_Date', rec.Inception_Date);
    printDat(l, 'Expiration_Date', rec.Expiration_Date);
    printCur(l, 'WrittenTotal', rec.WrittenTotal);
    printBol(l, 'FullyEarn', rec.FullyEarn);

    result := l.Text;
  finally
    l.Free;
  end;
end;

function serializeTransaction(rec: TTransaction): string;
var
  l: TStringList;
begin
  l := TStringList.Create;
  try
    printInt(l, 'PolicyID', rec.PolicyID, true);
    printInt(l, 'PremiumID', rec.PremiumID, true);
    printInt(l, 'Line_Num', rec.Line_Num, true);
    l.Values['Type'] := transTypeToString(rec.TrnType);
    printDat(l, 'Inception_Date', rec.Inception_Date);
    printDat(l, 'Expiration_Date', rec.Expiration_Date);
    printDat(l, 'Effective_Date', rec.Effective_Date);
    printDat(l, 'Entry_Date', rec.Entry_Date);
    printDat(l, 'Accounting_Date', rec.Accounting_Date);
    printCur(l, 'Fees', rec.Fees);
    printCur(l, 'BasePremium', rec.BasePremium);
    printCur(l, 'MinRetainedWPAmt', rec.MinRetainedWPAmt);
    printDbl(l, 'ShortRatePerc', rec.ShortRatePerc);
    printCur(l, 'MinWPAmt', rec.MinWPAmt);
    printCur(l, 'ForcedWPAmt', rec.ForcedWPAmt, false, iInactiveFlag);
    printBol(l, 'SetEarnDateOld', rec.SetEarnDateOld);
    printStr(l, 'Notes', rec.Notes);
    printInt(l, 'LineID', rec.LineID, true);
    printCur(l, 'WrittenTotal', rec.WrittenTotal);

    //LK: Moved from THistory
    printInt(l, 'DaysTOEarn', rec.DaysTOEarn);
    printInt(l, 'AccDays', rec.AccDays);
    printDbl(l, 'ProRataDiff', rec.ProRataDiff);
    printCur(l, 'FeeDiff', rec.FeeDiff);
    printCur(l, 'TotalAdj', rec.TotalAdj);
    printCur(l, 'Value', rec.Value);

    result := l.Text;
  finally
    l.Free;
  end;
end;

function serializeSegment(rec: TSegment): string;
var
  l: TStringList;
begin
  l := TStringList.Create;
  try
    printCur(l, 'Written_Premium', rec.Written_Premium);
    printCur(l, 'Written_Fees', rec.Written_Fees);
    printCur(l, 'Written_RoundAdj', rec.Written_RoundAdj);
    printDbl(l, 'Written_Factor', rec.Written_Factor);
    printDbl(l, 'ProRate_Factor', rec.ProRate_Factor);
    printCur(l, 'Earned_Premium', rec.Earned_Premium);
    printCur(l, 'Earned_Fees', rec.Earned_Fees);
    printCur(l, 'Earned_RoundAdj', rec.Earned_RoundAdj);
    printCur(l, 'Unearned_Premium', rec.Unearned_Premium);
    printCur(l, 'Unearned_Fees', rec.Unearned_Fees);
    printInt(l, 'Days_Earned', rec.Days_Earned);
    printCur(l, 'Daily_Earned', rec.Daily_Earned);
    printCur(l, 'Short_Rate', rec.Short_Rate);
    printBol(l, 'Visible', rec.Visible);

    result := l.Text;
  finally
    l.Free;
  end;
end;

function serializeLevelCoverage(rec: TLvlCoverage): string;
var
  l: TStringList;
begin
  l := TStringList.Create;
  try
    printInt(l, 'PRL_ID', rec.PRL_ID, true);
    printStr(l, 'Level_Name', rec.Level_Name, true);
    printStr(l, 'Premium_Name', rec.Premium_Name, true);
    printStr(l, 'WP_Table', rec.WP_Table);
    printStr(l, 'PD_Table', rec.PD_Table);
    printStr(l, 'PD_TransStat_Name', rec.PD_TransStat_Name);
    printStr(l, 'PD_ID_Name', rec.PD_ID_Name);
    printStr(l, 'PD_PolicyCodeName', rec.PD_PolicyCodeName);
    printStr(l, 'PD_EntryDate_Name', rec.PD_EntryDate_Name);
    printStr(l, 'PD_IncDate_Name', rec.PD_IncDate_Name);
    printStr(l, 'PD_EffDate_Name', rec.PD_EffDate_Name);
    printStr(l, 'PD_ExpDate_Name', rec.PD_ExpDate_Name);
    printStr(l, 'PD_AccDate_Name', rec.PD_AccDate_Name);
    printStr(l, 'PD_ShortRatePercName', rec.PD_ShortRatePercName);
    printStr(l, 'PD_MinWPAmtName', rec.PD_MinWPAmtName);
    printStr(l, 'PD_ForcedWPAmtName', rec.PD_ForcedWPAmtName);
    printStr(l, 'PD_MinRetainedWPAmtName', rec.PD_MinRetainedWPAmtName);
    printStr(l, 'PS_Table', rec.PS_Table);
    printBol(l, 'PS_AsFunct', rec.PS_AsFunct);
    printStr(l, 'PS_PolID_Name', rec.PS_PolID_Name);
    printStr(l, 'PS_ID_Name', rec.PS_ID_Name);
    printStr(l, 'PS_PolicyCodeName', rec.PS_PolicyCodeName);
    printStr(l, 'PS_Prem_Name', rec.PS_Prem_Name);
    printStr(l, 'PS_Fee_Name', rec.PS_Fee_Name);
    printStr(l, 'PS_Deleted_Name', rec.PS_Deleted_Name);
    printStr(l, 'PS_LevelRecID', rec.PS_LevelRecID);
    printStr(l, 'WPL_TableName', rec.WPL_TableName);
    printStr(l, 'EPL_TableName', rec.EPL_TableName);
    printDbl(l, 'RoundWpTo', rec.RoundWpTo);
    printDbl(l, 'RoundEpTo', rec.RoundEpTo);
    printDbl(l, 'ProRateRoundTo', rec.ProRateRoundTo); //LKPRORATE
    printDat(l, 'ProRateEffDate', rec.ProRateEffDate); //LKPRORATE
    printStr(l, 'EP_ErnDateOptName', rec.EP_ErnDateOptName);
    printBol(l, 'WPL_Mandatory', rec.WPL_Mandatory);
    printBol(l, 'EPL_Mandatory', rec.EPL_Mandatory);
    printBol(l, 'FullyEarn', rec.FullyEarn);

    result := l.Text;
  finally
    l.Free;
  end;
end;

function serializeLevelLine(rec: TLine): string;
var
  l: TStringList;
begin
  l := TStringList.Create;
  try
    printInt(l, 'LevelIndex', rec.LevelIndex, true);
    printInt(l, 'Level', rec.Level, true);
    printInt(l, 'Line_Num', rec.Line_Num, true);
    printStr(l, 'Level_Name', rec.Level_Name);
    printInt(l, 'WPL_ID', rec.WPL_ID, true);
    printInt(l, 'EPL_ID', rec.EPL_ID, true);
    printInt(l, 'PolID', rec.PolID, true);
    printInt(l, 'FrmID', rec.FrmID, true);
    printStr(l, 'PolicyCode', rec.PolicyCode);
    printInt(l, 'WrtPremID', rec.WrtPremID, true);
    l.Values['TrnType'] := transTypeToString(rec.TrnType);
    printInt(l, 'PRL_ID', rec.PRL_ID, true);
    printBol(l, 'DeletedSR', rec.DeletedSR);
    printBol(l, 'InactiveLevelRec', rec.InactiveLevelRec);
    printCur(l, 'MinRetainedWPAmt', rec.MinRetainedWPAmt);
    printDbl(l, 'ShortRatePerc', rec.ShortRatePerc);
    printCur(l, 'MinWPAmt', rec.MinWPAmt);
    printCur(l, 'ForcedWPAmt', rec.ForcedWPAmt);
    printDat(l, 'Inception_Date', rec.Inception_Date);
    printDat(l, 'Expiration_Date', rec.Expiration_Date);
    printDat(l, 'Effective_Date', rec.Effective_Date);
    printDat(l, 'Entry_Date', rec.Entry_Date);
    printDat(l, 'Accounting_Date', rec.Accounting_Date);

    printInt(l, 'PremSourceID', rec.PremSourceID, true);
    printCur(l, 'AnnualPremium', rec.AnnualPremium);
    printCur(l, 'AnnualFees', rec.AnnualFees);
    printCur(l, 'WrittenTotal', rec.WrittenTotal);

    printDbl(l, 'RoundWpTo', rec.RoundWpTo);
    printDbl(l, 'RoundEpTo', rec.RoundEpTo);
    printDbl(l, 'ProRateRoundTo', rec.ProRateRoundTo); //LKPRORATE
    printDat(l, 'ProRateEffDate', rec.ProRateEffDate); //LKPRORATE
    printStr(l, 'WPL_TableName', rec.WPL_TableName);
    printStr(l, 'EPL_TableName', rec.EPL_TableName);
    printBol(l, 'WPL_Mandatory', rec.WPL_Mandatory);
    printBol(l, 'EPL_Mandatory', rec.EPL_Mandatory);
    printBol(l, 'SetEarnDateOld', rec.SetEarnDateOld);
    printStr(l, 'LevelRecID', rec.LevelRecID, true);
    printBol(l, 'FullyEarn', rec.FullyEarn);
    
    result := l.Text;
  finally
    l.Free;
  end;
end;



//****************************** Public implementation *****************************

constructor TMax_Premium.Create(params: TPremium_Params);
begin
  inherited Create(nil);

  fParams := params;
  if fParams.DebugLog > '' then begin
    fLog := TFileLogger.Create(fParams.DebugLog, 10);
    fLog.NoTime := true;

    fDebugCache := TStringList.Create;
  end;

  SetLength(fCoverages, 0);

  Self.Debug('User Parameters:', serializeConfig(fParams));
end;

destructor TMax_Premium.Destroy;
var
  i: integer;
begin
  for i := Low(fCoverages) to High(fCoverages) do
    SetLength(fCoverages[i].Transactions, 0);

  SetLength(fCoverages, 0);
  FAN(fLog);
  FAN(fDebugCache);

  inherited;
end;

procedure TMax_Premium.Debug(msg: string; data: string = ''; id: string = '');
var
  idx: integer;
begin
  if not Assigned(fLog) then
    exit;

  // Do not log already logged IDs
  if id > '' then begin
    idx := fDebugCache.IndexOf(id);
    if idx > -1 then
      exit
    else
      fDebugCache.Add(id);
  end;

  if data > '' then
    msg := msg + #13#10 + data + #13#10;

  fLog.Log(msg);
end;

procedure TMax_Premium.DropTempTable(tableName: string);
var
  Q1: TSQLQuery;
  doIt: boolean;
begin
  if (tableName = '') then
    exit;

  Q1 := TSQLQuery.Create(self);
  try
    Q1.SQLConnection := fSQLConnection;

    //check if the temp table was created and still exist
    Q1.SQL.Clear;
    Q1.SQL.Add('select OBJECT_ID(''tempdb..' + tableName + ''') as TmpExist');
    Q1.Active := True;
    doIt := not Q1.EOF;
    Q1.Active := False;

    if doIt then begin
      Q1.SQL.Clear;
      Q1.SQL.Add('drop table [' + tableName + ']');
      Q1.ExecSQL;

      Self.Debug('Temp table dropped: ' + tableName);
    end;
  finally
    Q1.Free;
  end;
end;

function TMax_Premium.MakeTempTableName: string;
begin
  result := '#WP_' + KeepStringCharacters(fParams.PolicyCode, ALPHA_NUMERIC) + '_' + MaxRandomizer(6);

  Self.Debug('Temp table created: ' + result);
end;

//****************************** Private implementation ****************************

procedure TMax_Premium.LoadCalcWPResults(var coverage: TCoverage);
//procedure to load written prem records calulated by custom VRM
var
  Q1: TSQLQuery;
  i: Integer;
begin
  Q1 := TSQLQuery.Create(Self);
  try
    Q1.SQLConnection := Self.SQLConnection;

    for i := low(coverage.Transactions) to high(coverage.Transactions) do begin
      Q1.SQL.Clear;
      Q1.SQL.Add('select WP_ID, WP_Written_Premium, WP_Written_Fees, WP_DailyEarned, WP_RoundAdj, WP_Written_Premium_SR, WP_ProRate_Factor');
      Q1.SQL.Add('from [' + coverage.WPTableName + ']');
      Q1.SQL.Add('where WP_PolicyCode = :POL and WP_Prem_Name = :PRNM and WP_RecordID = :PID');

      Q1.ParamByName('POL').AsString:= fParams.PolicyCode;
      Q1.ParamByName('PRNM').AsString:= coverage.Name;
      Q1.ParamByName('PID').AsInteger:= coverage.Transactions[i].PolicyID;

      Q1.Open;
      if not Q1.Eof then begin
        coverage.Transactions[i].PremiumID := Q1.FieldByName('WP_ID').AsVariant;
        coverage.Transactions[i].Segment.Written_Premium := Q1.FieldByName('WP_Written_Premium').AsCurrency;
        coverage.Transactions[i].Segment.Written_Fees := Q1.FieldByName('WP_Written_Fees').AsCurrency;
        coverage.Transactions[i].Segment.Written_RoundAdj := Q1.FieldByName('WP_RoundAdj').AsFloat;
        coverage.Transactions[i].Segment.Daily_Earned := Q1.FieldByName('WP_DailyEarned').AsFloat;
        coverage.Transactions[i].Segment.Short_Rate := Q1.FieldByName('WP_Written_Premium_SR').AsCurrency;
        coverage.Transactions[i].Segment.ProRate_Factor := Q1.FieldByName('WP_ProRate_Factor').AsFloat;
      end;
      Q1.Close;
    end;
  finally
    Q1.Free;
  end;
end;

//**********************************************************************************

procedure TMax_Premium.LoadCalcEPResults(var coverage: TCoverage);
//procedure to load earned prem records calulated by custom VRM
var
  Q1: TSQLQuery;
  i: Integer;
begin
  Q1 := TSQLQuery.Create(Self);
  try
    Q1.SQLConnection := Self.SQLConnection;

    for i := low(coverage.Transactions) to high(coverage.Transactions) do begin
      Q1.SQL.Clear;
      Q1.SQL.Add('select EP_Written_Premium, EP_Written_Fees, EP_Earned_Premium, EP_Earned_Fees, EP_Days_Earned, EP_Unearned_Premium, EP_Unearned_Fees, EP_RoundAdj ');
      Q1.SQL.Add('from [' + coverage.EPTableName + '] ');
      Q1.SQL.Add('where EP_PolicyCode = :POL and EP_Prem_Name = :PRNM and EP_RecordID = :PID and cast(EP_Premium_Date as date) = cast(:DTE as date)');

      Q1.ParamByName('POL').AsString:= fParams.PolicyCode;
      Q1.ParamByName('PRNM').AsString:= coverage.Name;
      Q1.ParamByName('PID').AsInteger:= coverage.Transactions[i].PolicyID;
      Q1.ParamByName('DTE').AsSQLTimeStamp:= DateTimeToSQLTimeStamp(fCalcDate);
      Q1.Open;
      if not Q1.Eof then begin
        coverage.Transactions[i].Segment.Written_Premium:= Q1.FieldByName('EP_Written_Premium').AsCurrency;
        coverage.Transactions[i].Segment.Written_Fees:= Q1.FieldByName('EP_Written_Fees').AsCurrency;
        coverage.Transactions[i].Segment.Written_RoundAdj:= Q1.FieldByName('EP_RoundAdj').AsFloat;
        coverage.Transactions[i].Segment.Earned_Premium:= Q1.FieldByName('EP_Earned_Premium').AsCurrency;
        coverage.Transactions[i].Segment.Earned_Fees:= Q1.FieldByName('EP_Earned_Fees').AsCurrency;
        coverage.Transactions[i].Segment.Days_Earned:= Q1.FieldByName('EP_Days_Earned').AsInteger;
        coverage.Transactions[i].Segment.Unearned_Premium:= Q1.FieldByName('EP_Unearned_Premium').AsCurrency;
        coverage.Transactions[i].Segment.Unearned_Fees:= Q1.FieldByName('EP_Unearned_Fees').AsCurrency;
      end;
      Q1.Close;
    end;
  finally
    Q1.Free;
  end;
end;

//**********************************************************************************

function TMax_Premium.GetAllCoverageTotals(calcDate: TDateTime): TSegment;
var
  i: integer;
  seg: TSegment;
begin
  result := getBlankSegment;

  for i := Low(fCoverages) to High(fCoverages) do begin
    seg := fCoverages[i].Totals;

    result.Written_Premium := result.Written_Premium + seg.Written_Premium;
    result.Written_Fees := result.Written_Fees + seg.Written_Fees;
    result.Written_RoundAdj := result.Written_RoundAdj + seg.Written_RoundAdj;
    result.Earned_Premium := result.Earned_Premium + seg.Earned_Premium;
    result.Earned_Fees := result.Earned_Fees + seg.Earned_Fees;
    result.Earned_RoundAdj := result.Earned_RoundAdj + seg.Earned_RoundAdj;
    result.Unearned_Premium := result.Unearned_Premium + seg.Unearned_Premium;
    result.Unearned_Fees := result.Unearned_Fees + seg.Unearned_Fees;
    //result.Days_Earned := result.Days_Earned + seg.Days_Earned;
    result.Short_Rate := result.Short_Rate + seg.Short_Rate; //19079
    result.Daily_Earned := result.Daily_Earned + seg.Daily_Earned; //LKPRORATE

    //LK: This returns last values only!
    result.Written_Factor := seg.Written_Factor;
    result.ProRate_Factor := seg.ProRate_Factor;
  end;

  result.Days_Earned := DaysBetween(calcDate + 1, fCoverages[0].Transactions[0].Inception_Date);

  Self.Debug('All Coverage Total Segment:', serializeSegment(result));
end;

procedure TMax_Premium.UpdateCoverageTotals(var coverage: TCoverage);
var
  trn: TTransaction;
  total, seg: TSegment;
  i: integer;
begin
  total := getBlankSegment;

  for i := Low(coverage.Transactions) to High(coverage.Transactions) do begin
    trn := coverage.Transactions[i];
    Self.Debug('Output Transaction [' + coverage.Name + ']:', serializeTransaction(trn));

    seg := trn.Segment;
    Self.Debug('Output Segment [' + coverage.Name + ']:', serializeSegment(seg));

    total.Written_Premium := total.Written_Premium + seg.Written_Premium;
    total.Written_Fees := total.Written_Fees + seg.Written_Fees;
    total.Written_RoundAdj := total.Written_RoundAdj + seg.Written_RoundAdj;
    total.Earned_Premium := total.Earned_Premium + seg.Earned_Premium;
    total.Earned_Fees := total.Earned_Fees + seg.Earned_Fees;
    total.Earned_RoundAdj := total.Earned_RoundAdj + seg.Earned_RoundAdj;
    total.Unearned_Premium := total.Unearned_Premium + seg.Unearned_Premium;
    total.Unearned_Fees := total.Unearned_Fees + seg.Unearned_Fees;
    total.Days_Earned := total.Days_Earned + seg.Days_Earned;
    total.Short_Rate := total.Short_Rate + seg.Short_Rate; //19079
    total.Daily_Earned := total.Daily_Earned + seg.Daily_Earned;
    //LK? if i = 0 then
      //LK? total.Daily_Earned := total.Daily_Earned / 2;

    //LK: This returns last values only!
    total.Written_Factor := seg.Written_Factor;
    total.ProRate_Factor := seg.ProRate_Factor;
  end;
  coverage.Totals := total;

  Self.Debug('Total Segment [' + coverage.Name + ']:', serializeSegment(total));
end;

//**********************************************************************************

function TMax_Premium.GetCalculationType: integer;
var
  Q1: TSQLQuery;
begin
  result := 1;

  if fParams.LOBID <= 0 then
    raise Exception.Create('Missing Line of Business ID!');

  Q1 := TSQLQuery.Create(Self);
  try
    Q1.SQLConnection := FSQLConnection;

    //Get the sLOB_PremCalcType from LOB
    Q1.SQL.Clear;
    Q1.SQL.Add('SELECT sLOB_PremCalcType');
    Q1.SQL.Add('FROM System_LOBs with (NOLOCK)');
    Q1.SQL.Add('WHERE sLOB_ID = :LOBID');
    Q1.ParamByName('LOBID').AsInteger := fParams.LOBID;

    Q1.Open;
    if not Q1.EOF then begin
      if Q1.FieldByName('sLOB_PremCalcType').AsInteger > 0 then
        result := Q1.FieldByName('sLOB_PremCalcType').AsInteger;
    end;
    Q1.Close;
  finally
    Q1.Free;
  end;
end;

function TMax_Premium.GetCalculationCase(var spName: string): integer;
var
  ds: TSQLDataSet;
begin
  //if fParams.PremiumName = '' then
    //raise Exception.Create('Missing PremiumName!');

  ds := TSQLDataSet.Create(nil);
  try
    ds.SQLConnection := FSQLConnection;
    ds.CommandType := ctStoredProc;
    ds.SchemaName  := 'cor';
    ds.CommandText := 'usp_Premium_GetCalculationCase';
    ds.Params.ParamByName('I_strPremiumName').AsString := fParams.PremiumName;
    ds.ExecSQL(False);

    spName := ds.Params.ParamByName('O_strStoredProcedureName').AsString;
    result := ds.Params.ParamByName('O_intCalculationCase').AsInteger;
  finally
    ds.Free
  end;
end;

function TMax_Premium.LoadCoverages: boolean;
var
  Q1: TSQLQuery;
  cov: TCoverage;
  c: integer;
begin
  Self.Debug('START of LoadCoverages...');

  Q1 := TSQLQuery.Create(Self);
  try
    Q1.SQLConnection := FSQLConnection;

    Q1.SQL.Clear;
    Q1.SQL.Add('SELECT sPREM_ID, sPREM_Premium_Name, sPREM_PolicyData_Table, sPREM_RecID_FieldName, sPREM_PolCode_FieldName');
    Q1.SQL.Add(', sPREM_Premium_FieldName, sPREM_Fee_FieldName, sPREM_EntryDate_FieldName, sPREM_EffDate_FieldName');
    Q1.SQL.Add(', sPREM_AccDate_FieldName, sPREM_IncDate_FieldName, sPREM_ExpDate_FieldName');
    Q1.SQL.Add(', sPREM_TransStat_FieldName, sPREM_TransOrd_FieldName, sPREM_TransNotes_FieldName, sPREM_WrittPremium_TableName');
    Q1.SQL.Add(', sPREM_EarnPremium_TableName, isnull(sPREM_RoundTo, 0.01) as sPREM_RoundTo, isnull(sPREM_EP_RoundTo, 0.00) as sPREM_EP_RoundTo');
    Q1.SQL.Add(', isnull(sPREM_WP_Mandatory, 1) as sPREM_WP_Mandatory, isnull(sPREM_EP_Mandatory, 0) as sPREM_EP_Mandatory');
    Q1.SQL.Add(', sPREM_ShortRatePerc_FieldName, sPREM_MinWPAmt_FieldName, sPREM_ForcedWPAmt_FieldName, sPREM_MinRetainedWPAmt_Name'); //19079
    Q1.SQL.Add(', sPREM_PolData_as_Fn'); //27464
    Q1.SQL.Add(', sPREM_ErnDateOpt_FieldName, sPREM_CalcRuleName'); //25934
    Q1.SQL.Add(', sPREM_ProRate_EffDate, sPREM_ProRate_RoundTo'); //LKPRORATE
    Q1.SQL.Add(', sPREM_FullyEarn');
    Q1.SQL.Add('FROM [' + cSysPrem + '] with (NOLOCK)');
    Q1.SQL.Add('WHERE sLOB_ID = :LOB');
    Q1.ParamByName('LOB').AsInteger := fParams.LOBID;

    if fParams.FRMID >= 0 then begin
      Q1.SQL.Add(' and sFRM_ID = :FRM');
      Q1.ParamByName('FRM').AsInteger := fParams.FRMID;
    end;
    if fParams.PremiumName > '' then begin
      Q1.SQL.Add(' and sPREM_Premium_Name = :COV');
      Q1.ParamByName('COV').AsString := fParams.PremiumName;
    end;

    Self.Debug('Query LoadCoverages:', Q1.SQL.Text, 'LoadCoverages');
    Self.Debug('Query LoadCoverages:', serializeQueryParams(Q1));

    Q1.Open;
    c := -1;
    while not Q1.EOF do begin
      cov := Self.LoadCoverage(Q1);
      c := Self.AddCoverage(cov);

      Q1.Next;
    end;
    Q1.Close;

    Self.Debug('Loaded ' + IntToStr(c + 1) + ' coverages');
    if c = -1 then
      raise Exception.Create('Missing premium coverage configuration!');

    result := True;
  finally
    Q1.Free;
    Self.Debug('END of LoadCoverages');
  end;
end;

function TMax_Premium.LoadTransactions: boolean;
var
  Q1: TSQLQuery;
  trn: TTransaction;
  c, t: integer;
  baseQuery: string;
begin
  Self.Debug('START of LoadTransactions...');

  if SQLConnection = nil then
    raise Exception.Create('No SQL Connection! Set SQL connection before calculating written premium.');

  if fParams.PolicyCode = '' then
    raise Exception.Create('Missing Policy Code!');

  //load premium fields array from sys_premiums table...
  Q1 := TSQLQuery.Create(Self);
  try
    Q1.SQLConnection := FSQLConnection;

    for c := Low(fCoverages) to High(fCoverages) do begin
      SetLength(fCoverages[c].Transactions, 0);

      //Get the policy information
      Q1.SQL.Clear;
      Q1.SQL.Add('SELECT A.' + fCoverages[c].PolicyIDName + ' as ID,');
      Q1.SQL.Add(' B.sPTRN_TransType as TransType,');
      Q1.SQL.Add(' A.' + fCoverages[c].EntryDateName + ' as EntryDate,');
      Q1.SQL.Add(' A.' + fCoverages[c].EffDateName + ' as EffectiveDate,');
      Q1.SQL.Add(' A.' + fCoverages[c].AccDateName + ' as AccountingDate,');
      Q1.SQL.Add(' A.' + fCoverages[c].IncDateName + ' as InceptionDate,');
      Q1.SQL.Add(' A.' + fCoverages[c].ExpDateName + ' as ExpirationDate,');
      Q1.SQL.Add(' A.' + fCoverages[c].FeeName + ' as Fees,');
      Q1.SQL.Add(' A.' + fCoverages[c].PremiumName + ' as PolicyPremium,');
      Q1.SQL.Add(' A.' + fCoverages[c].TransNoteName + ' as TransactionNotes');

      if fCoverages[c].ShortRatePercName > '' then //19079
        Q1.SQL.Add(', isnull(A.' + fCoverages[c].ShortRatePercName + ', 0) as ShortRatePerc ')
      else
        Q1.SQL.Add(', 0 as ShortRatePerc ');

      if fCoverages[c].MinRetainedWPAmtName > '' then
        Q1.SQL.Add(', isnull(A.' + fCoverages[c].MinRetainedWPAmtName + ', 0) as MinRetainedWPAmt ')
      else
        Q1.SQL.Add(', 0 as MinRetainedWPAmt ');

      if fCoverages[c].MinWPAmtName > '' then //19079
        Q1.SQL.Add(', isnull(A.' + fCoverages[c].MinWPAmtName + ', 0) as MinWPAmt ')
      else
        Q1.SQL.Add(', 0 as MinWPAmt ');

      if fCoverages[c].ForcedWPAmtName > '' then //19079, 65358
        Q1.SQL.Add(', isnull(A.' + fCoverages[c].ForcedWPAmtName + ', ' + sInactiveFlag + ') as ForcedWPAmt ')
      else
        Q1.SQL.Add(', ' + sInactiveFlag + ' as ForcedWPAmt ');

      if fCoverages[c].EP_ErnDateOptName > '' then //25934
        Q1.SQL.Add(', isnull(A.' + fCoverages[c].EP_ErnDateOptName + ', 0) as ErnDateOpt ')
      else
        Q1.SQL.Add(', 0 as ErnDateOpt ');

      Q1.SQL.Add(', isnull(WP.WP_ID, 0) as PremiumID');

      if fCoverages[c].PD_AsFunct then
        Q1.SQL.Add(' from ' + fCoverages[c].TableName + ' as A ') //27464 table as function
      else
        Q1.SQL.Add(' from [' + fCoverages[c].TableName + '] as A with (NOLOCK)');

      Q1.SQL.Add(' join [' + cSysPolTrans + '] as B with(NOLOCK) on B.sPTRN_ID = A.sPTRN_ID');

      // LK: Up to this point this and next query are identical so reuse it!
      baseQuery := Q1.SQL.Text;

      Q1.SQL.Add(' and B.sPTRN_TransType not in ' + cNoQuotes);
      Q1.SQL.Add(' left outer join [' + fCoverages[c].WPTableName + '] as WP with (NOLOCK) ');
      Q1.SQL.Add(' on WP.WP_RecordID = A.' + fCoverages[c].PolicyIDName + ' and WP_Prem_Name = :PREM');
      Q1.SQL.Add(' Where A.' + fCoverages[c].PolicyCodeName + ' = :POL');
      Q1.SQL.Add(' and A.' + fCoverages[c].TransStatName + ' = 1');
      Q1.SQL.Add(' Order by ' + fCoverages[c].TransOrdName);

      Q1.ParamByName('POL').AsString := fParams.PolicyCode;
      Q1.ParamByName('PREM').AsString := fCoverages[c].Name;

      Self.Debug('Query LoadTransactions:', Q1.SQL.Text, 'LoadTransactions');
      Self.Debug('Query LoadTransactions:', serializeQueryParams(Q1));

      Q1.Open;
      t := -1;
      while not Q1.EOF do begin
        trn := Self.LoadTransaction(Q1);
        t := Self.AddTransaction(c, trn);

        Q1.Next;
      end;
      Q1.Close;

      if t = -1 then
        raise Exception.Create('Premium ' + fCoverages[c].TableName + ' table does not contain a policy code ' + fParams.PolicyCode + '!');

      //if requested to add additional (let say unfinished record) to the premium calculation
      //MJ 6/17/11 - fixed for error with the polid (used Qute id in case of using view - AA/ALI) is a quoteid and pointing to the policytabe for invalid record...
      fWithAdditionalTransaction := fAddRecID > 0;
      if fWithAdditionalTransaction then begin
        // LK: Reuse the identical base query!
        Q1.SQL.Text := baseQuery;

        Q1.SQL.Add(' left outer join [' + fCoverages[c].WPTableName + '] as WP with (NOLOCK) ');
        Q1.SQL.Add(' on WP.WP_RecordID = A.' + fCoverages[c].PolicyIDName + ' and WP_Prem_Name = :PREM');
        Q1.SQL.Add(' Where A.' + fCoverages[c].PolicyIDName + ' = :RECID');
        Q1.SQL.Add(' and A.' + fCoverages[c].TransStatName + ' = 0');

        Q1.ParamByName('RECID').AsInteger := fAddRecID;
        Q1.ParamByName('PREM').AsString := fCoverages[c].Name;

        Self.Debug('Query LoadAdditionalTransaction:', Q1.SQL.Text, 'LoadAdditionalTransaction');
        Self.Debug('Query LoadAdditionalTransaction:', serializeQueryParams(Q1));

        Q1.Open;
        if not Q1.EOF then begin
          trn := Self.LoadTransaction(Q1);
          t := Self.AddTransaction(c, trn);
        end;
        Q1.Close;
      end;

      Self.Debug('Loaded ' + IntToStr(t + 1) + ' transactions');
    end;

    Self.Debug('Loaded ' + IntToStr(c + 1) + ' coverages');

    result := True;
  finally
    Q1.Free;
    Self.Debug('END of LoadTransactions');
  end;
end;

function TMax_Premium.LoadCoverage(Q1: TSQLQuery): TCoverage;
begin
  result := getBlankCoverage;

  result.CalculationType := fCalcType; //#18868
  result.RecID := Q1.FieldByName('sPREM_ID').AsInteger;
  result.Name := Q1.FieldByName('sPREM_Premium_Name').AsString;
  result.WPTableName := Q1.FieldByName('sPREM_WrittPremium_TableName').AsString;
  result.EPTableName := Q1.FieldByName('sPREM_EarnPremium_TableName').AsString;
  result.RoundWpTo := Q1.FieldByName('sPREM_RoundTo').AsFloat;

  result.RoundEpTo := Q1.FieldByName('sPREM_EP_RoundTo').AsFloat;
  if result.RoundEpTo = 0 then
    result.RoundEpTo := result.RoundWpTo;

  result.WP_Mandatory := Q1.FieldByName('sPREM_WP_Mandatory').AsBoolean; //#24728
  result.EP_Mandatory := Q1.FieldByName('sPREM_EP_Mandatory').AsBoolean; //#24728
  result.PD_AsFunct := Q1.FieldByName('sPREM_PolData_as_Fn').AsBoolean; //#27464
  result.CalcRuleName := Q1.FieldByName('sPREM_CalcRuleName').AsString; //51102
  result.ProRateEffDate := Q1.FieldByName('sPREM_ProRate_EffDate').AsDateTime;
  result.ProRateRoundTo := Q1.FieldByName('sPREM_ProRate_RoundTo').AsFloat;
  result.FullyEarn := Q1.FieldByName('sPREM_FullyEarn').AsBoolean;

  // Not needed by the new SQL calulator!
  if fParams.UseSQLCalc <> 1 then begin
    // Select
    result.PolicyIDName := Q1.FieldByName('sPREM_RecID_FieldName').AsString;
    result.EntryDateName := Q1.FieldByName('sPREM_EntryDate_FieldName').AsString;
    result.EffDateName := Q1.FieldByName('sPREM_EffDate_FieldName').AsString;
    result.AccDateName := Q1.FieldByName('sPREM_AccDate_FieldName').AsString;
    result.IncDateName := Q1.FieldByName('sPREM_IncDate_FieldName').AsString;
    result.ExpDateName := Q1.FieldByName('sPREM_ExpDate_FieldName').AsString;
    result.TransNoteName := Q1.FieldByName('sPREM_TransNotes_FieldName').AsString;
    result.PremiumName := Q1.FieldByName('sPREM_Premium_FieldName').AsString;
    result.FeeName := Q1.FieldByName('sPREM_Fee_FieldName').AsString;
    result.MinRetainedWPAmtName := Q1.FieldByName('sPREM_MinRetainedWPAmt_Name').AsString;
    result.ShortRatePercName := Q1.FieldByName('sPREM_ShortRatePerc_FieldName').AsString; //#19079
    result.MinWPAmtName := Q1.FieldByName('sPREM_MinWPAmt_FieldName').AsString; //#19079
    result.ForcedWPAmtName := Q1.FieldByName('sPREM_ForcedWPAmt_FieldName').AsString; //#19079
    result.EP_ErnDateOptName := Q1.FieldByName('sPREM_ErnDateOpt_FieldName').AsString; //#25934
    // From
    result.TableName := Q1.FieldByName('sPREM_PolicyData_Table').AsString;
    // Where
    result.PolicyCodeName := Q1.FieldByName('sPREM_PolCode_FieldName').AsString;
    result.TransStatName := Q1.FieldByName('sPREM_TransStat_FieldName').AsString;
    // Order by
    result.TransOrdName := Q1.FieldByName('sPREM_TransOrd_FieldName').AsString;
  end;
end;

function TMax_Premium.LoadTransaction(Q1: TSQLQuery): TTransaction;
begin
  result := getBlankTransaction;

  result.PolicyID := Q1.FieldByName('ID').AsInteger;
  result.PremiumID := Q1.FieldByName('PremiumID').AsVariant;
  result.TrnType := strToTransType(Q1.FieldByName('TransType').AsString);
  result.Inception_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('InceptionDate').AsDateTime));
  result.Expiration_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('ExpirationDate').AsDateTime));
  result.Effective_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('EffectiveDate').AsDateTime));
  result.Entry_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('EntryDate').AsDateTime));
  result.Accounting_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('AccountingDate').AsDateTime));
  result.Fees := Q1.FieldByName('Fees').AsFloat;
  result.BasePremium := Q1.FieldByName('PolicyPremium').AsFloat;
  result.Notes := Q1.FieldByName('TransactionNotes').AsString;
  result.MinRetainedWPAmt := Q1.FieldByName('MinRetainedWPAmt').AsFloat;
  result.ShortRatePerc := Q1.FieldByName('ShortRatePerc').AsFloat; //19079
  result.MinWPAmt := Q1.FieldByName('MinWPAmt').AsFloat; //19079
  result.ForcedWPAmt := Q1.FieldByName('ForcedWPAmt').AsFloat; //65358
  result.SetEarnDateOld := Q1.FieldByName('ErnDateOpt').AsInteger = 1; //25934
end;

function TMax_Premium.LoadCoveragesWithTransactions: boolean;
var
  Q1: TSQLQuery;
  cov, lastCov: TCoverage;
  trn: TTransaction;
  i, c, t: integer;
  addCvg: boolean;
  spName: string;
begin
  Self.Debug('START of LoadCoveragesWithTransactions...');

  Q1 := TSQLQuery.Create(Self);
  try
    Q1.SQLConnection := FSQLConnection;

    i := Self.GetCalculationCase(spName);
    if i = 0 then begin
      Q1.SQL.Text := spName + '	:PC, :AR';
    end else begin
      Q1.SQL.Text := spName + ' :PC, :AR, :PN';
      Q1.ParamByName('PN').AsString := fParams.PremiumName;
    end;
    Q1.ParamByName('PC').AsString := fParams.PolicyCode;
    Q1.ParamByName('AR').AsInteger := fAddRecID;

    Self.Debug('Query LoadCovsWithTrans:', Q1.SQL.Text, 'LoadCovsWithTrans');
    Self.Debug('Query LoadCovsWithTrans:', serializeQueryParams(Q1));

    Q1.Open;
    addCvg := false;
    c := -1;
    t := -1;
    while not Q1.EOF do begin
      cov := Self.LoadCoverage(Q1);

      if c = -1 then
        addCvg := true
      else
        addCvg := cov.RecID <> lastCov.RecID;

      if addCvg then
        c := Self.AddCoverage(cov);

      lastCov := cov;
      trn := Self.LoadTransaction(Q1);
      t := Self.AddTransaction(c, trn);

      Q1.Next;
    end;
    Q1.Close;

    Self.Debug('Loaded ' + IntToStr(c + 1) + ' coverages and ' + IntToStr(t + 1) + ' transactions in each');

    result := True;
  finally
    Q1.Free;
    Self.Debug('END of LoadCoveragesWithTransactions');
  end;
end;


//LKPRORATE
function TMax_Premium.UpdateWithNewProRatedFactor(var currTrn, prevTrn: TTransaction): double;
var
  currTrnEffTerm: integer;
  currWP: double;
begin
  //1. Get input data
  currTrnEffTerm := GetDaysBetweenDates(currTrn.Effective_Date, fPolicyExpirationDate, fIgnoreLeapYear) - 1;

  //2. Get Prorated Factor
  {TODO:
  if (ignoreProRateFactor) then
    currTrn.Segment.ProRate_Factor := 1 for test enable this!
  else
  }
    currTrn.Segment.ProRate_Factor := currTrnEffTerm / fPolicyDays;

  //3. Round Prorated Factor
  currTrn.Segment.ProRate_Factor := RoundToFraction(currTrn.Segment.ProRate_Factor, fProRateRoundTo);

  //4. Get Current Written Premium
  currWP := (currTrn.BasePremium - prevTrn.BasePremium) * currTrn.Segment.ProRate_Factor;
  currWP := RoundMoney(currWP, fRoundWpTo);

  //5. Get Daily Eearned
  if currTrnEffTerm > 0 then
    result := currWP / currTrnEffTerm
  else
    result := 0;
end;

function TMax_Premium.RemoveFlaggedTransactions(var Trans: TTransactions): boolean;
var
  total, removed, i, j: integer;
begin
  total := Length(Trans);
  removed := 0;
  i := 0;
  while i < total - removed do begin
    if Trans[i].DoRemove then begin
      for j := i to High(Trans) - 1 do
        Trans[j] := Trans[j + 1];
      Inc(removed);
    end else
      Inc(i);
  end;
  SetLength(Trans, total - removed);

  Self.Debug('Removed ' + IntToStr(removed) + ' flagged transactions from calculation');

  result := true;
end;

//**********************************************************************************

function TMax_Premium.CalculateCoveragePremium(coverageIdx: integer): TCoverage;
//Updated function for calculate WP/EP #23071
//  Created to follow new premium spreadsheet - premium_v2.xlsx
//  Created:      02/26/12 MJ

// negatePrem is used to diferensiate CN calculation in the case of deleted level record for premium by level.
// The deleted level record is still calculated even we do not have annual premium on it and we need to correctly process CN/RI/EN
var
  fpuMode: TFPUPrecisionMode;
  cvg: TCoverage;
  trn, prevTrn: TTransaction;
  seg: TSegment;
  earnings: TEarnings;
  feeDiffSum, amount: currency;
  negatePrem, negateFees, useNewProRateLogic: boolean;
  i, j: integer;
  earnedDayAdj: byte;
  dt: TDateTime;
begin
  fpuMode := SetPrecisionMode(pmExtended);
  try
    cvg := fCoverages[coverageIdx]; // Reference. Must be updated before return!

    Self.Debug('START of CalculateCoveragePremium [' + cvg.Name + ']...');

    fPolicyInceptionDate := cvg.Inception_Date;
    fPolicyExpirationDate := cvg.Expiration_Date;
    fRoundWpTo := cvg.RoundWpTo;
    fRoundEpTo := cvg.RoundEpTo;
    fProRateRoundTo := cvg.ProRateRoundTo; // default 0
    fIgnoreLeapYear := cvg.CalculationType = 2;
    fPolicyDays := GetDaysBetweenDates(fPolicyInceptionDate, fPolicyExpirationDate, fIgnoreLeapYear) - 1;

    //Angie: we would want to set this flag to true, even if it's fully earned, because we need to remove OOSE transactions.
    useNewProRateLogic := (fProRateRoundTo > 0) and (cvg.ProRateEffDate <= fPolicyInceptionDate);

    //LK: Applied Out Of Sequence Endorsement fix to all clients (originaly for AGCS only). Visible on summary screen before binding a quote. (RC 6.10.0.8)
    if fWithAdditionalTransaction then begin
      // Remove transactions after effective date of the last additional transaction
      dt := cvg.Transactions[High(cvg.Transactions)].Effective_Date;
      for i := Low(cvg.Transactions) to High(cvg.Transactions) do
        cvg.Transactions[i].DoRemove := cvg.Transactions[i].Effective_Date > dt;

      Self.RemoveFlaggedTransactions(cvg.Transactions);
    end;



    {
    Earnings has a record for each transaction. Kind of like a calendar for each transaction? Earnings has two arrays, Amounts and Days, and each of these
    has as many records as there are days in the policy term. (So, a year long term will have 365 records in both sub arrays) The Days array will have
    date values that begin with the policy's inception date and increment one day for each record. Presumable the last record will be the policy's
    expiration date. It looks like the Amounts array will hold the earned premium for that transaction for that calendar day.
    }
    //SS calculations
    SetLength(earnings, Length(cvg.Transactions));
    for i := low(cvg.Transactions) to high(cvg.Transactions) do begin
      SetLength(earnings[i].Amounts, fPolicyDays);
      SetLength(earnings[i].Days, fPolicyDays);

      for j := low(earnings[i].Days) to high(earnings[i].Days) do
        earnings[i].Days[j] := fPolicyInceptionDate + j;

      cvg.Transactions[i].TotalAdj := 0;
    end;



    // Main calculation loop
    for i := low(cvg.Transactions) to high(cvg.Transactions) do begin
      trn := cvg.Transactions[i]; // Copy must be updated at the end of this loop!

      negatePrem := false;
      negateFees := false;

      //SS calculations B7:B14
      trn.Segment.Visible := trn.Accounting_Date <= fCalcDate;

      Self.Debug('Input Transaction [' + cvg.Name + ']:', serializeTransaction(trn));
      Self.Debug('Input Segment [' + cvg.Name + ']:', serializeSegment(trn.Segment));

      //SS calculations H7:T14
      if trn.Segment.Visible then begin

        //SS calculations L7:L14
        trn.AccDays := trunc(trn.Accounting_Date - trn.Effective_Date) + 1;

        //SS calculations H7:H14
        if trn.TrnType in [CN, CR] then begin
          trn.ProRataDiff := trn.BasePremium * -1;
          negatePrem := trn.BasePremium = 0;
        end else begin
          if i > low(cvg.Transactions) then begin
            if (trn.TrnType = RI) then
              trn.ProRataDiff := cvg.Transactions[i - 1].ProRataDiff * -1
            else
              trn.ProRataDiff := trn.BasePremium - cvg.Transactions[i - 1].BasePremium;
          end else
            trn.ProRataDiff := trn.BasePremium;
        end;

        //SS calculations I7:I14
        if (cvg.FullyEarn) then
          trn.DaysTOEarn := GetDaysBetweenDates(fPolicyInceptionDate, fPolicyExpirationDate, fIgnoreLeapYear) - 1
        else
          trn.DaysTOEarn := GetDaysBetweenDates(trn.Effective_Date, fPolicyExpirationDate, fIgnoreLeapYear) - 1;

        //SS calculations Q7:Q14
        if trn.Effective_Date = fPolicyInceptionDate then begin
          if trn.TrnType in [CN, CR] then begin
            trn.FeeDiff := trn.Fees * -1;
            negateFees := trn.Fees = 0;
          end else begin
            feeDiffSum := 0;
            for j := low(cvg.Transactions) to i - 1 do
              feeDiffSum := feeDiffSum + cvg.Transactions[j].FeeDiff;
            trn.FeeDiff := trn.Fees - feeDiffSum;
          end;
        end else begin
          feeDiffSum := 0;
          for j := low(cvg.Transactions) to i - 1 do
            feeDiffSum := feeDiffSum + cvg.Transactions[j].FeeDiff;

          if trn.TrnType in [CN, CR] then
            trn.FeeDiff := (feeDiffSum - trn.Fees) * -1
          else
            trn.FeeDiff := trn.Fees - feeDiffSum;
        end;

        trn.Segment.Written_Fees := trn.FeeDiff;
        if negateFees then
          trn.Segment.Written_Fees := trn.Segment.Written_Fees * -1;

        if (useNewProRateLogic) and (not cvg.FullyEarn) then begin
          // LKPRORATE: Apply custom pro rate factor rounding as 0.001

          if i > 0 then
            prevTrn := cvg.Transactions[i - 1]
          else
            prevTrn.BasePremium := 0;
          trn.Segment.Daily_Earned := Self.UpdateWithNewProRatedFactor(trn, prevTrn);
        end else
          //SS calculations K7:K14
          trn.Segment.Daily_Earned := trn.ProRataDiff / fPolicyDays;


        //SS calculations B18:J25 *****
        for j := 0 to i - 1 do begin
          //Angie: This is a loop inside of a loop. "trn" is the transaction we're currently calculating. For any transaction that had an effective date greater than trn's effective date...
          if trn.Effective_Date < cvg.Transactions[j].Effective_Date then begin
            //Angie: set dt to be the number of days between this effective date and trn's effective date...
            dt := cvg.Transactions[j].Effective_Date - trn.Effective_Date;
            //Angie: if this transaction is not the NB transaction, if trn is not a cancellation and this transaction is a reinstatement...
            if (j > 0) and (trn.TrnType <> CN) and (cvg.Transactions[j].TrnType = RI) then
              dt := dt - (cvg.Transactions[j].Effective_Date - cvg.Transactions[j - 1].Effective_Date);

            {
            Angie: "amount" is a poor descriptor, and it's copied to "Value" below, which is also a poor descriptor. "Amount" is being used to calculate TotalAdj.
              "Value" does not appear to be used in this function, but may be used elsewhere? At any rate, it appears that amount = number of days after the trn's
              effective date times the current transaction's daily earned?  How much the current transaction will earn after this transaction?
            }
            amount := dt * cvg.Transactions[j].Segment.Daily_Earned;
          end else
            amount := 0;

          if trn.Segment.Daily_Earned < 0 then
            amount := amount * -1;
          trn.TotalAdj := trn.TotalAdj + amount;

          cvg.Transactions[j].Value := amount;
        end;

        //#46428 - fix for negative annual prorated premium (credit premium)
        if trn.BasePremium < 0 then
          trn.TotalAdj := trn.TotalAdj * -1;

        //SS calculations C29:J395 - Earned Premium
        for j := Low(earnings[i].Amounts) to High(earnings[i].Amounts) do begin
          //Angie: This is a loop inside of a loop. "trn" is the transaction we're currently calculating (i). We are looping through the transaction's "calendar" described above.
          //  For all days prior to the transactions's accounting date, set "Amounts" to 0; nothing was earned for that day.
          if earnings[i].Days[j] < trn.Accounting_Date then
            earnings[i].Amounts[j] := 0
          else begin
            //Angie: On the accounting date, set amount earned, considering if the effective date and accounting date do not match.
            if earnings[i].Days[j] = trn.Accounting_Date then
              earnings[i].Amounts[j] := (trn.Segment.Daily_Earned * trn.AccDays) - trn.TotalAdj
              //Angie: After the accounting date, set today's earned to be the daily earned
            else
              earnings[i].Amounts[j] := trn.Segment.Daily_Earned;

            //Angie: If it's not the first day, set today to have sum up today's daily earned plus yesterday's earned amount.
            if j > low(earnings[i].Amounts) then
              earnings[i].Amounts[j] := earnings[i].Amounts[j] + earnings[i].Amounts[j - 1];
          end;
        end;

        //SS calculations M7:M14
        earnedDayAdj := IfThen(trn.SetEarnDateOld, 0, 1); //#25934
        if trn.Accounting_Date <= fCalcDate then begin
          if fPolicyExpirationDate < fCalcDate + 1 then
            trn.Segment.Days_Earned := GetDaysBetweenDates(trn.Effective_Date, fPolicyExpirationDate, fIgnoreLeapYear) - 1
          else
            trn.Segment.Days_Earned := GetDaysBetweenDates(trn.Effective_Date, fCalcDate + earnedDayAdj, fIgnoreLeapYear) - 1;
        end else
          trn.Segment.Days_Earned := 0;

        if (useNewProRateLogic) and (not cvg.FullyEarn) then
          // LKPRORATE: Round again the rounded pro rate factor
          trn.Segment.Written_Premium := RoundMoney(trn.ProRataDiff * trn.Segment.ProRate_Factor - trn.TotalAdj, fRoundWpTo)
        else
          //SS calculations J7:J14
          trn.Segment.Written_Premium := ((trn.ProRataDiff * trn.DaysTOEarn) / fPolicyDays) - trn.TotalAdj;

        if negatePrem then
          trn.Segment.Written_Premium := trn.Segment.Written_Premium * -1;

        //SS calculations O7:O14
        trn.Segment.Earned_Premium := (trn.Segment.Daily_Earned * trn.Segment.Days_Earned) - trn.TotalAdj;
        if negatePrem then
          trn.Segment.Earned_Premium := trn.Segment.Earned_Premium * -1;
      end else begin
        trn.AccDays := 0;
        trn.ProRataDiff := 0;
        trn.FeeDiff := 0;
        trn.Value := 0;
        trn.TotalAdj := 0;
        trn.Segment.Daily_Earned := 0;
        trn.Segment.Days_Earned := 0;
      end;

      //SS calculations P396:W396 - Earned Fees
      for j := low(earnings[i].Amounts) to high(earnings[i].Amounts) do begin
        if earnings[i].Days[j] = trn.Accounting_Date then
          trn.Segment.Earned_Fees := trn.FeeDiff;
      end;
      if negateFees then
        trn.Segment.Earned_Fees := trn.Segment.Earned_Fees * -1;
      trn.Segment.Unearned_Fees := trn.Segment.Written_Fees - trn.Segment.Earned_Fees;

      //19079 - ShortRate
      if (trn.ShortRatePerc > 0) and (trn.Segment.Written_Premium <> 0) then begin
        trn.Segment.Short_Rate := RoundMoney((trn.Segment.Written_Premium / 100) * trn.ShortRatePerc, fRoundWpTo) * -1;
        trn.Segment.Written_Premium := trn.Segment.Written_Premium + trn.Segment.Short_Rate;
      end else
        trn.Segment.Short_Rate := 0;

      //#65358 - min premium
      if (trn.MinWPAmt <> 0) and (trn.Segment.Written_Premium < trn.MinWPAmt) then
        trn.Segment.Written_Premium := trn.MinWPAmt;

      //#65358 - forced premium
      if trn.ForcedWPAmt <> iInactiveFlag then
        trn.Segment.Written_Premium := trn.ForcedWPAmt;

      //Minimum Retained Premium
      if (trn.MinRetainedWPAmt > 0) then
        fDoMinRetainedWP := true;

      Self.RoundWrittenPremium(trn.Segment);

      cvg.Transactions[i] := trn;
    end; // Main calculation loop



    Self.RoundEarnedPremiums(cvg);
    Self.UpdateCoverageTotals(cvg);



    fCoverages[coverageIdx] := cvg;
    result := cvg;
  finally
    SetPrecisionMode(fpuMode);
    Self.Debug('END of CalculateCoveragePremium [' + cvg.Name + ']');
  end;
end;

procedure TMax_Premium.RoundEarnedPremiums(var cvg: TCoverage);
var
  amount, tempAdj: currency;
  trn: TTransaction;
  i: integer;
  shouldFullyEarn: boolean;
begin
  {#35531, 11/19/14 - EP rounding
    - done by using EP round to variable, set it up in System_Premium(_level) table
    - the rounding differenece is saved ino the premium record for debug reason, not saved into the EP table (yet) and is NOT being forwarded to the next transaction
    - do not change the rounding method unless well understood!
  }
  for i := Low(cvg.Transactions) to High(cvg.Transactions) do begin
    trn := cvg.Transactions[i]; // Reference must be updated!

    {#36132: we adjust the EP by the running sum of WP and EP:
      - get rounded EP (TempAmt)
      - add to the WP sum this WP transaction amt
      - if WP running sum < EP runnnig sum then calculate the adjustment as difference between WPSum and EPsum
      - we add the adjustment to the rounded EP and round again
      - we add the adjusted EP to the running EP sum
      - we store the rounding adjustment and running difference to the EP difference field
    }
    amount := RoundMoney(trn.Segment.Earned_Premium, fRoundEpTo);
    cvg.RunWPSum := cvg.RunWPSum + trn.Segment.Written_Premium;
    if Abs(cvg.RunEPSum + amount) > ABS(cvg.RunWPSum) then begin
      TempAdj := cvg.RunWPSum - (cvg.RunEPSum + amount);
      amount := RoundMoney(amount + TempAdj, fRoundEpTo);
    end;

    //adjust the EP if EP calculated on or after expiration to make sure that EP = WP - fully earned
    shouldFullyEarn := fCalcDate >= fPolicyExpirationDate;
    if (shouldFullyEarn) and (amount <> trn.Segment.Written_Premium) then begin
      TempAdj := amount - trn.Segment.Written_Premium;
      amount := RoundMoney(amount - TempAdj, fRoundEpTo);
    end;

    trn.Segment.Earned_RoundAdj := trn.Segment.Earned_Premium - amount;
    trn.Segment.Earned_Premium := amount;
    cvg.RunEPSum := cvg.RunEPSum + trn.Segment.Earned_Premium;
    {#36132 end}

    trn.Segment.Unearned_Premium := trn.Segment.Written_Premium - trn.Segment.Earned_Premium;

    if trn.Segment.Written_Premium < 0 then
      trn.Segment.Written_Factor := -1
    else
      trn.Segment.Written_Factor := 1;

    // Update the original transaction
    cvg.Transactions[i] := trn;
  end; //EP rounding loop
end;

procedure TMax_Premium.RoundWrittenPremium(var seg: TSegment);
var
  amount: currency;
begin
  //#30247 - round WP and save the difference
  amount := RoundMoney(seg.Written_Premium, fRoundWpTo);
  seg.Written_RoundAdj := amount - seg.Written_Premium;
  seg.Written_Premium := amount;
end;

procedure TMax_Premium.ApplyMinRetainedWP;
var
  cvg: TCoverage;
  trn: TTransaction;
  totalWP, reducedWP: currency;
  multiplier: double;
  c, t: integer;
begin
  Self.Debug('START of ApplyMinRetainedWP');

  // Get total WP from all coverage's NB
  totalWP := 0;
  for c := Low(fCoverages) to High(fCoverages) do
    totalWP := totalWP + fCoverages[c].Transactions[0].BasePremium;

  // Adjust WP for all transactions with MinRetainedWPAmt set
  for c := Low(fCoverages) to High(fCoverages) do begin
    cvg := fCoverages[c]; // Copy!
    for t := Low(cvg.Transactions) to High(cvg.Transactions) do begin
      trn := cvg.Transactions[t]; // Copy!

      //Minimum Retained Premium
      if (trn.MinRetainedWPAmt > 0) then begin
        reducedWP := totalWP - trn.MinRetainedWPAmt;
        multiplier := reducedWP / totalWP;

        if (trn.TrnType in [CN]) then
          trn.Segment.Written_Premium := trn.BasePremium * multiplier * -1;
        if (trn.TrnType in [RI]) then
          trn.Segment.Written_Premium := trn.BasePremium * multiplier;

        Self.RoundWrittenPremium(trn.Segment);

        cvg.Transactions[t] := trn;
      end;
    end;

    Self.RoundEarnedPremiums(cvg);
    Self.UpdateCoverageTotals(cvg);

    fCoverages[c] := cvg;
  end;

  Self.Debug('END of ApplyMinRetainedWP');
end;

procedure TMax_Premium.ApplyLevelMinRetainedWP(var cvg: TCoverage);
var
  trn: TTransaction;
  multiplier: double;
  c, t: integer;
begin
  Self.Debug('START of ApplyLevelMinRetainedWP');

  for t := Low(cvg.Transactions) to High(cvg.Transactions) do begin
    trn := cvg.Transactions[t]; // Copy!

    //Minimum Retained Premium
    if (trn.MinRetainedWPAmt > 0) then begin
      if cvg.WrittenTotal <> 0 then
        multiplier := trn.BasePremium / cvg.WrittenTotal
      else
        multiplier := 0;

      if (trn.TrnType in [CN, RI]) then
        trn.Segment.Written_Premium := trn.WrittenTotal * multiplier;

      Self.RoundWrittenPremium(trn.Segment);

      cvg.Transactions[t] := trn;
    end;
  end;

  Self.Debug('END of ApplyLevelMinRetainedWP');
end;

//****************************** Published Implementation ***************************

function TMax_Premium.GetEarnedPremiumByPolicyCode(const calcDate: TDateTime; addRecID: integer = 0): Boolean;
var
  ReqList: TStringList;
  TrnMan: TMax_TransManager;
  cov: TCoverage;
  is_WP: boolean;
  i: integer;
begin
  result := False;

  Self.Debug('START of GetEarnedPremiumByPolicyCode...');
  try
    Self.Clear;

    fCalcDate := calcDate;
    fAddRecID := addRecID;
    fCalcType := Self.GetCalculationType;

    if fParams.UseSQLCalc = 1 then
      Self.LoadCoveragesWithTransactions
    else begin
      Self.LoadCoverages;
      Self.LoadTransactions;
    end;

    //lop all premiums and calculate...
    is_WP := false;
    ReqList := TStringList.Create;
    TrnMan := TMax_TransManager.Create;
    try
      for i := Low(fCoverages) to High(fCoverages) do begin
        cov := fCoverages[i]; // Copy!

        //if custom CalcRuleName is specified, then skip core calculation and call the VRM
        if cov.CalcRuleName > '' then begin
          //prefill the ReqList with required line data
          if fCalcDate = 73051 then begin
            is_WP:= true;
            ReqList.Values['WP_Action']:= 'WP_UPDATE';
          end else
            ReqList.Values['WP_Action']:= 'EP_UPDATE';

          ReqList.Values['WP_PolicyCode']:= fParams.PolicyCode;
          ReqList.Values['WP_LOBID']:= IntToStr(fParams.LOBID);
          ReqList.Values['WP_FRMID']:= IntToStr(fParams.FRMID);
          ReqList.Values['WP_PremiumDate']:= FormatDateTime('MM/DD/YYYY', fCalcDate);
          ReqList.Values['WP_AddtRecordID']:= IntToStr(fAddRecID);
          ReqList.Values['WP_PremiumName']:= cov.Name;
          ReqList.Values['WP_SysPremID']:= IntToStr(cov.RecID);
          ReqList.Values['WP_PremiumTableName']:= cov.TableName;
          ReqList.Values['WP_PolicyIDName']:= cov.PolicyIDName;
          ReqList.Values['WP_PolicyCodeName']:= cov.PolicyCodeName;
          ReqList.Values['WP_EntryDateName']:= cov.EntryDateName;
          ReqList.Values['WP_EffDateName']:= cov.EffDateName;
          ReqList.Values['WP_AccDateName']:= cov.AccDateName;
          ReqList.Values['WP_IncDateName']:= cov.IncDateName;
          ReqList.Values['WP_ExpDateName']:= cov.ExpDateName;
          ReqList.Values['WP_TransStatName']:= cov.TransStatName;
          ReqList.Values['WP_TransOrdName']:= cov.TransOrdName;
          ReqList.Values['WP_TransNoteName']:= cov.TransNoteName;
          ReqList.Values['WP_PremiumFieldName']:= cov.PremiumName;
          ReqList.Values['WP_FeeName']:= cov.FeeName;
          ReqList.Values['WP_WrittPremTableName']:= cov.WPTableName;
          ReqList.Values['WP_EarnedPremTableName']:= cov.EPTableName;
          ReqList.Values['WP_RoundWPPremiumTo']:= FloatToStr(cov.RoundWpTo);
          ReqList.Values['WP_RoundEarnPremiumTo']:= FloatToStr(cov.RoundEpTo);
          ReqList.Values['WP_ShortRatePercName']:= cov.ShortRatePercName;
          ReqList.Values['WP_MinWPAmtName']:= cov.MinWPAmtName;
          ReqList.Values['WP_ForcedWPAmtName']:= cov.ForcedWPAmtName;
          ReqList.Values['WP_EP_ErnDateOptName']:= cov.EP_ErnDateOptName;
          ReqList.Values['WP_CalcRuleName']:= cov.CalcRuleName;
          ReqList.Values['WP_PremCalcType']:= IntToStr(cov.CalculationType);
          ReqList.Values['WP_WPMandatory']:= IfThen(cov.WP_Mandatory, '1', '0');
          ReqList.Values['WP_EPMandatory']:= IfThen(cov.EP_Mandatory, '1', '0');
          ReqList.Values['WP_PolData_as_Fn']:= IfThen(cov.PD_AsFunct, '1', '0');
          ReqList.Values['WP_FullyEarn']:= IfThen(cov.FullyEarn, '1', '0');

          if not ExecuteCompiledScript('\pre\' + cov.CalcRuleName, self.SQLConnection, ReqList, TrnMan) then
            raise Exception.Create('Error executing compiled script [' + cov.CalcRuleName + ']. Error message: ' + ReqList.Values['LastError']);

          if ReqList.Values['LastError'] = '' then begin
            if is_WP then
              Self.LoadCalcWPResults(fCoverages[i])
            else
              Self.LoadCalcEPResults(fCoverages[i]);
          end else
            raise Exception.Create('Process compiled script [' + cov.CalcRuleName + '] raised error message: ' + ReqList.Values['LastError']);

          //we will load all the custom results on the end for all premiums...
        end else begin
          fCoverages[i].Inception_Date := cov.Transactions[0].Inception_Date;
          fCoverages[i].Expiration_Date := cov.Transactions[0].Expiration_Date;

          Self.CalculateCoveragePremium(i);
        end;
      end; // Coverages loop

      if fDoMinRetainedWP then
        Self.ApplyMinRetainedWP();

      result := True;
    finally
      Self.Debug('END of GetEarnedPremiumByPolicyCode');

      TrnMan.Free;
      ReqList.Free;
    end;
  except
    on E: Exception do begin
      Self.Debug('Error in GetEarnedPremiumByPolicyCode: ' + E.Message);
      raise Exception.Create(E.Message);
    end;
  end;
end;

//**********************************************************************************

function TMax_Premium.GetCoverages(addRecID: integer = 0): TCoverages;
begin
  //Written is the same as Earned as of the END OF TIME...
  Self.GetEarnedPremiumByPolicyCode(StrToDateTime('1/1/2100'), addRecID);
  
  result := fCoverages;
end;

//**********************************************************************************

function TMax_Premium.UpdatePremiumByLevel(var totals: TSegment; RecID, addRecID: integer; calcDate: TDateTime; updateDB: boolean): boolean;
{
 Procedure   : calculate and update WP by coverage and risk table
 Create date : 06/27/2012 MJ
}
var
  Q1: TSQLQuery;
  Levels: TLevels;
  level: TLevel;
  Lines: TLines;
  line: TLine;
  cov: TCoverage;
  lCov: TLvlCoverage;
  trn: TTransaction;
  seg: TSegment;
  LevelIndex, MaxIndexCount, LastLine: integer;
  l, c, t, i: integer; //LK: Levels, Coverages, Transactions, Lines counters!
  wpOnly, doSumarize: boolean;
  PLTempTable, s: string;
begin
  result := false;

  Self.Debug('START of UpdatePremiumByLevel...');

  // this function is used for both WP and EP calculations!
  wpOnly := calcDate = 0;
  if wpOnly then begin
    Self.Debug('Written premium for policy: ' + fParams.PolicyCode);

    fCalcDate := StrToDateTime('01/01/2100');
    //this can be used only for WP summary to filter out transaction with future acc. date #36898
    //we still calculate as for end of time but then we use this date condition for the WP summary
    if round(fParams.PremiumDate) <= 0 then
      fParams.PremiumDate := StrToDateTime('01/01/2100');
  end else begin
    Self.Debug('Earned premium for policy: ' + fParams.PolicyCode);

    fCalcDate := calcDate;
  end;

  Q1 := TSQLQuery.Create(self);
  try
    Q1.SQLConnection := FSQLConnection;

    //#38947 - create prem level temp table to save calc result and post to the premium table on the end...
    if (updateDB) then begin
      PLTempTable := Self.MakeTempTableName;
      Q1.SQL.Clear;
      Q1.SQL.Add('create table ' + PLTempTable + '( ');

      if wpOnly then begin
        Q1.SQL.Add('[WPL_ID] [bigint] null, ');
        Q1.SQL.Add('[WPL_TableName] [varchar](100) null, ');
        Q1.SQL.Add('[WPL_RecordID] [int] NULL, ');
        Q1.SQL.Add('[WPL_PolicyCode] [varchar](25) NULL, ');
        Q1.SQL.Add('[WPL_FrmID] [int] NULL, ');
        Q1.SQL.Add('[WP_ID] [bigint] NULL, ');
        Q1.SQL.Add('[WPL_Line_Num] [int] NULL, ');
        Q1.SQL.Add('[WPL_Level_Name] [varchar](100) NULL, ');
        Q1.SQL.Add('[WPL_TransactionType] [varchar](3) NULL, ');
        Q1.SQL.Add('[WPL_Level] [int] NULL, ');
        Q1.SQL.Add('[sPRL_ID] [int] NULL, ');
        Q1.SQL.Add('[WPL_PremSourceID] [int] NULL, ');
        Q1.SQL.Add('[WPL_AnnualPremium] [money] NULL, ');
        Q1.SQL.Add('[WPL_AnnualFees] [money] NULL, ');
        Q1.SQL.Add('[WPL_Written_Premium] [money] NULL, ');
        Q1.SQL.Add('[WPL_Written_Fees] [money] NULL, ');
        Q1.SQL.Add('[WPL_RoundingAdj] [money] NULL, ');
        Q1.SQL.Add('[WPL_Deleted] [bit] NULL, ');
        Q1.SQL.Add('[WPL_UniqueID] [varchar](50) NULL, ');
        Q1.SQL.Add('[WPL_Written_Premium_SR] [money] NULL, ');
        Q1.SQL.Add('[ShouldDel] [bit] NULL )');
      end else begin
        Q1.SQL.Add('[EPL_ID] [bigint] NULL, ');
        Q1.SQL.Add('[EPL_TableName] [varchar](100) NULL, ');
        Q1.SQL.Add('[EPL_RecordID] [int] NULL, ');
        Q1.SQL.Add('[EPL_Premium_Date] [datetime] NULL, ');
        Q1.SQL.Add('[EPL_PolicyCode] [varchar](25) NULL, ');
        Q1.SQL.Add('[EPL_FrmID] [int] NULL, ');
        Q1.SQL.Add('[WP_ID] [bigint] NULL, ');
        Q1.SQL.Add('[EPL_Line_Num] [int] NULL, ');
        Q1.SQL.Add('[EPL_Level_Name] [varchar](100) NULL, ');
        Q1.SQL.Add('[EPL_TransactionType] [varchar](3) NULL, ');
        Q1.SQL.Add('[EPL_Level] [int] NULL, ');
        Q1.SQL.Add('[sPRL_ID] [int] NULL, ');
        Q1.SQL.Add('[EPL_PremSourceID] [int] NULL, ');
        Q1.SQL.Add('[EPL_AnnualPremium] [money] NULL, ');
        Q1.SQL.Add('[EPL_AnnualFees] [money] NULL, ');
        Q1.SQL.Add('[EPL_Days_Earned] [int] NULL, ');
        Q1.SQL.Add('[EPL_Written_Premium] [money] NULL, ');
        Q1.SQL.Add('[EPL_Written_Fees] [money] NULL, ');
        Q1.SQL.Add('[EPL_Earned_Premium] [money] NULL, ');
        Q1.SQL.Add('[EPL_Earned_Fees] [money] NULL, ');
        Q1.SQL.Add('[EPL_Unearned_Premium] [money] NULL, ');
        Q1.SQL.Add('[EPL_Unearned_Fees] [money] NULL, ');
        Q1.SQL.Add('[EPL_Deleted] [bit] NULL, ');
        Q1.SQL.Add('[EPL_UniqueID] [varchar](50) NULL, ');
        Q1.SQL.Add('[EPL_RoundAdj] [money] NULL, ');
        Q1.SQL.Add('[ShouldDel] [bit] NULL )');
      end;
      Q1.ExecSQL;
    end;

    // Load levels
    Q1.SQL.Clear;
    Q1.SQL.Add('select sPRL_Level, sPRL_WPL_TableName, sPRL_EPL_TableName from [' + cSysPremLvls + '] with (NOLOCK)');
    Q1.SQL.Add('where sFRM_ID = :FRM and sLOB_ID = :LOB group by sPRL_Level, sPRL_WPL_TableName, sPRL_EPL_TableName order by sPRL_Level');
    Q1.ParamByName('FRM').AsInteger := fParams.FRMID;
    Q1.ParamByName('LOB').AsInteger := fParams.LOBID;

    Self.Debug('Query LoadLevels:', Q1.SQL.Text, 'LoadLevels');
    Self.Debug('Query LoadLevels:', serializeQueryParams(Q1));

    Q1.Active := true;

    l := 0;
    SetLength(Levels, 16);
    while not Q1.EOF do begin
      if l = Length(Levels) then
        SetLength(Levels, l + 16);

      level := Levels[l];
      level.Index := Q1.FieldByName('sPRL_Level').AsInteger;
      level.WPL_TableName := Q1.FieldByName('sPRL_WPL_TableName').AsString;
      level.EPL_TableName := Q1.FieldByName('sPRL_EPL_TableName').AsString;
      level.RunWPSum := 0;
      level.RunEPSum := 0;
      Levels[l] := level;

      Inc(l);
      Q1.Next;
    end;
    Q1.Active := false;

    SetLength(Levels, l);
    Self.Debug('Loaded ' + IntToStr(l) + ' levels.', ' ');

    for l := Low(Levels) to High(Levels) do begin
      level := Levels[l];

      // Load configuration for level's coverages
      Q1.SQL.Clear;
      Q1.SQL.Add('select sPRL_ID, sLOB_ID, sPRL_Name, sPRL_Premium_Name, sPRL_WP_Table');
      Q1.SQL.Add(', sPRL_PD_ID_Name, sPRL_PD_PolicyCode_Name, sPRL_PD_Table, sPRL_PD_EntryDate_Name, sPRL_PD_IncDate_Name');
      Q1.SQL.Add(', sPRL_PD_EffDate_Name, sPRL_PD_ExpDate_Name, sPRL_PD_AccDate_Name');
      Q1.SQL.Add(', sPRL_PS_Table, sPRL_PS_AsFunct, sPRL_PS_PolID_Name');
      Q1.SQL.Add(', sPRL_PS_ID_Name, sPRL_PS_PolicyCode_Name, sPRL_PS_Prem_Name, sPRL_PS_Fee_Name, sPRL_PS_Deleted_Name, sPRL_PS_UniqueID_Name');
      Q1.SQL.Add(', isnull(sPRL_WP_Mandatory, 1) as sPRL_WP_Mandatory, isnull(sPRL_EP_Mandatory, 0) as sPRL_EP_Mandatory');
      Q1.SQL.Add(', sPRL_PD_TransStat_FieldName');
      Q1.SQL.Add(', sPRL_RoundTo, isnull(sPRL_EP_RoundTo, 0) as sPRL_EP_RoundTo');
      Q1.SQL.Add(', sPRL_ErnDateOpt_FieldName'); //25934
      Q1.SQL.Add(', sPRL_PD_ShortRatePerc_Name, sPRL_PD_MinWPAmt_Name, sPRL_PD_ForcedWPAmt_Name, sPRL_PD_MinRetainedWPAmt_Name'); //38615
      Q1.SQL.Add(', sPRL_ProRate_EffDate, sPRL_ProRate_RoundTo'); //LKPRORATE
      Q1.SQL.Add(', sPRL_FullyEarn');
      Q1.SQL.Add('from [' + cSysPremLvls + '] with (NOLOCK)');
      Q1.SQL.Add('where sPRL_Level = :LVL and sFRM_ID = :FRM and sLOB_ID = :LOB');

      if fParams.PremiumName > '' then begin
        Q1.SQL.Add(' and sPRL_Premium_Name = :COV');
        Q1.ParamByName('COV').AsString := fParams.PremiumName;
      end;

      Q1.ParamByName('LVL').AsInteger := level.Index;
      Q1.ParamByName('FRM').AsInteger := fParams.FRMID;
      Q1.ParamByName('LOB').AsInteger := fParams.LOBID;

      Self.Debug('Query LoadLevelCoverages ' + IntToStr(l) + ':', Q1.SQL.Text, 'LoadLevelCoverages');
      Self.Debug('Query LoadLevelCoverages ' + IntToStr(l) + ':', serializeQueryParams(Q1));

      Q1.Active := true;

      c := 0;
      SetLength(level.Coverages, 16);
      while not Q1.EOF do begin
        if c = Length(level.Coverages) then
          SetLength(level.Coverages, c + 16);

        lCov.PRL_ID := Q1.FieldByName('sPRL_ID').AsInteger;
        lCov.Level_Name := Q1.FieldByName('sPRL_Name').AsString;
        lCov.Premium_Name := Q1.FieldByName('sPRL_Premium_Name').AsString;
        lCov.WP_Table := Q1.FieldByName('sPRL_WP_Table').AsString;

        lCov.PD_Table := Q1.FieldByName('sPRL_PD_Table').AsString;
        lCov.PD_TransStat_Name := Q1.FieldByName('sPRL_PD_TransStat_FieldName').AsString;
        lCov.PD_ID_Name := Q1.FieldByName('sPRL_PD_ID_Name').AsString;
        lCov.PD_PolicyCodeName := Q1.FieldByName('sPRL_PD_PolicyCode_Name').AsString;
        lCov.PD_EntryDate_Name := Q1.FieldByName('sPRL_PD_EntryDate_Name').AsString;
        lCov.PD_IncDate_Name := Q1.FieldByName('sPRL_PD_IncDate_Name').AsString;
        lCov.PD_EffDate_Name := Q1.FieldByName('sPRL_PD_EffDate_Name').AsString;
        lCov.PD_ExpDate_Name := Q1.FieldByName('sPRL_PD_ExpDate_Name').AsString;
        lCov.PD_AccDate_Name := Q1.FieldByName('sPRL_PD_AccDate_Name').AsString;

        lCov.PS_Table := Q1.FieldByName('sPRL_PS_Table').AsString;
        lCov.PS_AsFunct := Q1.FieldByName('sPRL_PS_AsFunct').AsBoolean; //#27464
        lCov.PS_PolID_Name := Q1.FieldByName('sPRL_PS_PolID_Name').AsString;
        lCov.PS_ID_Name := Q1.FieldByName('sPRL_PS_ID_Name').AsString;
        lCov.PS_PolicyCodeName := Q1.FieldByName('sPRL_PS_PolicyCode_Name').AsString;
        lCov.PS_Prem_Name := Q1.FieldByName('sPRL_PS_Prem_Name').AsString;
        lCov.PS_Fee_Name := Q1.FieldByName('sPRL_PS_Fee_Name').AsString;
        lCov.PS_Deleted_Name := Q1.FieldByName('sPRL_PS_Deleted_Name').AsString;

        //lCov.WPL_TableName := Q1.FieldByName('sPRL_WPL_TableName').AsString;
        //lCov.EPL_TableName := Q1.FieldByName('sPRL_EPL_TableName').AsString;
        lCov.RoundWpTo := Q1.FieldByName('sPRL_RoundTo').AsFloat;
        lCov.RoundEpTo := Q1.FieldByName('sPRL_EP_RoundTo').AsFloat;
        if lCov.RoundEpTo = 0 then
          lCov.RoundEpTo := lCov.RoundWpTo;

        lCov.PS_LevelRecID := Q1.FieldByName('sPRL_PS_UniqueID_Name').AsString;
        lCov.WPL_Mandatory := Q1.FieldByName('sPRL_WP_Mandatory').AsBoolean; //#24728
        lCov.EPL_Mandatory := Q1.FieldByName('sPRL_EP_Mandatory').AsBoolean; //#24728
        lCov.EP_ErnDateOptName := Q1.FieldByName('sPRL_ErnDateOpt_FieldName').AsString; //#25934
        lCov.PD_ShortRatePercName := Q1.FieldByName('sPRL_PD_ShortRatePerc_Name').AsString; //#38615
        lCov.PD_MinWPAmtName := Q1.FieldByName('sPRL_PD_MinWPAmt_Name').AsString; //#38615
        lCov.PD_ForcedWPAmtName := Q1.FieldByName('sPRL_PD_ForcedWPAmt_Name').AsString; //#65358
        lCov.PD_MinRetainedWPAmtName := Q1.FieldByName('sPRL_PD_MinRetainedWPAmt_Name').AsString;

        lCov.ProRateEffDate := Q1.FieldByName('sPRL_ProRate_EffDate').AsDateTime;
        lCov.ProRateRoundTo := Q1.FieldByName('sPRL_ProRate_RoundTo').AsFloat;
        lCov.FullyEarn := Q1.FieldByName('sPRL_FullyEarn').AsBoolean;

        Self.Debug('Level ' + IntToStr(l) + ' coverage ' + IntToStr(c) + ':', serializeLevelCoverage(lCov));

        level.Coverages[c] := lCov;
        Inc(c);
        Q1.Next;
      end;
      Q1.Active := False;
      SetLength(level.Coverages, c);
      Levels[l] := level;
      Self.Debug('Loaded ' + IntToStr(l) + ' coverages for level ' + IntToStr(c), ' ');

      //check the data...
      if Length(level.Coverages) = 0 then
        raise exception.create('Attention - "[' + cSysPremLvls + ']" table does not contain valid premium by level records.');
    end; //Levels loop
    Self.Debug('All levels loaded.', ' ');



    // Loop through levels (all level data records for all transactions)
    totals := getBlankSegment;
    for l := Low(Levels) to High(Levels) do begin
      level := Levels[l];

      // Loop through level's coverages/risks
      for c := Low(level.Coverages) to High(level.Coverages) do begin
        lCov := level.Coverages[c];

        // Load level's coverage/risk transactions into Level Lines
        Q1.SQL.Clear;
        Q1.SQL.Add('select POL.' + lCov.PD_ID_Name + ' as PolID, A.WP_ID as WrtPremID, A.WP_Line_Num as Line_Num, ');
        if lCov.PS_LevelRecID > '' then
          Q1.SQL.Add('PS.' + lCov.PS_LevelRecID + ' as LevelRecID, ') //25493
        else
          Q1.SQL.Add(''''' as LevelRecID, ');
        if lCov.PS_Deleted_Name > '' then
          Q1.SQL.Add('isnull(PS.' + lCov.PS_Deleted_Name + ', 0) as DeletedSR, ')
        else
          Q1.SQL.Add('cast(0 as bit) as DeletedSR, ');
        Q1.SQL.Add('POL.sFRM_ID, A.WP_TransactionType as TransactionType, ');
        Q1.SQL.Add('POL.' + lCov.PD_IncDate_Name + ' as Inception_Date, ');
        Q1.SQL.Add('POL.' + lCov.PD_ExpDate_Name + ' as	Expiration_Date, ');
        Q1.SQL.Add('POL.' + lCov.PD_EffDate_Name + ' as Effective_Date, ');
        Q1.SQL.Add('POL.' + lCov.PD_EntryDate_Name + ' as Entry_Date, ');
        Q1.SQL.Add('POL.' + lCov.PD_AccDate_Name + ' as Accounting_Date, ');

        if lCov.PD_ShortRatePercName > '' then
          Q1.SQL.Add('POL.' + lCov.PD_ShortRatePercName + ' as ShortRatePerc, ');

        if lCov.PD_MinWPAmtName > '' then
          Q1.SQL.Add('isnull(POL.' + lCov.PD_MinWPAmtName + ', 0) as MinWPAmt, ');

        if lCov.PD_ForcedWPAmtName > '' then
          Q1.SQL.Add('isnull(PS.' + lCov.PD_ForcedWPAmtName + ', ' + sInactiveFlag + ') as ForcedWPAmt, ')
        else
          Q1.SQL.Add(sInactiveFlag + ' as ForcedWPAmt, ');

        if lCov.PD_MinRetainedWPAmtName > '' then
          Q1.SQL.Add('POL.' + lCov.PD_MinRetainedWPAmtName + ' as MinRetainedWPAmt, A.WP_Written_Premium as WrittenTotal, ');

        Q1.SQL.Add('PS.' + lCov.PS_ID_Name + ' as PremSourceID, ');
        Q1.SQL.Add('PS.' + lCov.PS_Prem_Name + ' as AnnualPremium, ');
        Q1.SQL.Add('PS.' + lCov.PS_Fee_Name + ' as AnnualFees, ');
        if wpOnly then
          Q1.SQL.Add('0 as EPL_ID, ')
        else
          Q1.SQL.Add('isnull(EPL.EPL_ID, 0) as EPL_ID, ');
        Q1.SQL.Add('isnull(WPL.WPL_ID, 0) as WPL_ID ');
        if lCov.EP_ErnDateOptName > '' then
          Q1.SQL.Add(', isnull(POL.' + lCov.EP_ErnDateOptName + ', 0) as ErnDateOpt ') //25934
        else
          Q1.SQL.Add(', 0 as ErnDateOpt '); //25934

        Q1.SQL.Add('from [' + lCov.WP_Table + '] as A with (NOLOCK) ');
        Q1.SQL.Add('join [' + lCov.PD_Table + '] as POL with (NOLOCK) ');
        Q1.SQL.Add(' on POL.' + lCov.PD_ID_Name + ' = A.WP_RecordID ');
        Q1.SQL.Add(' and POL.' + lCov.PD_PolicyCodeName + ' = A.WP_PolicyCode');

        if lCov.PS_AsFunct then
          Q1.SQL.Add('join ' + lCov.PS_Table + ' as PS ') //27464 table as function
        else
          Q1.SQL.Add('join [' + lCov.PS_Table + '] as PS with (NOLOCK) ');

        Q1.SQL.Add(' on PS.' + lCov.PS_PolID_Name + ' = A.WP_RecordID ');
        Q1.SQL.Add(' and PS.' + lCov.PS_PolicyCodeName + ' = POL.' + lCov.PD_PolicyCodeName + ' ');
        Q1.SQL.Add('left outer join [' + level.WPL_TableName + '] as WPL with (NOLOCK) ');
        Q1.SQL.Add(' on WPL.WPL_PolicyCode = A.WP_PolicyCode ');
        Q1.SQL.Add(' and WPL.WPL_RecordID = A.WP_RecordID ');
        Q1.SQL.Add(' and WPL.WPL_Line_Num = A.WP_Line_Num ');
        Q1.SQL.Add(' and WPL.WPL_Level_Name = ''' + lCov.Level_Name + ''' ');
        Q1.SQL.Add(' and WPL.WPL_PremSourceID = PS.' + lCov.PS_ID_Name + ' ');
        if lCov.PS_LevelRecID > '' then
          Q1.SQL.Add(' and WPL.WPL_UniqueID = PS.' + lCov.PS_LevelRecID + ' ');
        if not wpOnly then begin
          Q1.SQL.Add('left outer join [' + level.EPL_TableName + '] as EPL with (NOLOCK) ');
          Q1.SQL.Add(' on EPL.EPL_PolicyCode = A.WP_PolicyCode ');
          Q1.SQL.Add(' and EPL.EPL_RecordID = A.WP_RecordID ');
          Q1.SQL.Add(' and EPL.EPL_Line_Num = A.WP_Line_Num ');
          Q1.SQL.Add(' and EPL.EPL_Level_Name = ''' + lCov.Level_Name + ''' ');
          Q1.SQL.Add(' and EPL.EPL_PremSourceID = PS.' + lCov.PS_ID_Name + ' ');
          if lCov.PS_LevelRecID > '' then
            Q1.SQL.Add(' and EPL.EPL_UniqueID = PS.' + lCov.PS_LevelRecID + ' ');
          Q1.SQL.Add(' and EPL.EPL_Premium_Date = ''' + FormatDateTime('MM/DD/YYYY', fCalcDate) + ''' ');
        end;
        Q1.SQL.Add('where A.WP_PolicyCode = :POL ');
        Q1.SQL.Add('and A.WP_Prem_Name = :PREM ');
        Q1.SQL.Add('and POL.' + lCov.PD_TransStat_Name + ' = 1 ');
        Q1.SQL.Add('order by A.WP_Line_Num, A.WP_Prem_Name, LevelRecID');

        Q1.ParamByName('POL').AsString := fParams.PolicyCode;
        Q1.ParamByName('PREM').AsString := lCov.Premium_Name;

        Self.Debug('Query LoadLevelLine ' + IntToStr(l) + ',' + IntToStr(c) + ':', Q1.SQL.Text, 'LoadLevelLine');
        Self.Debug('Query LoadLevelLine ' + IntToStr(l) + ',' + IntToStr(c) + ':', serializeQueryParams(Q1));

        Q1.Active := true;

        i := 0;
        SetLength(Lines, 16);
        LevelIndex := 0;
        MaxIndexCount := 0;
        LastLine := 0;
        while not Q1.EOF do begin
          if i = Length(Lines) then
            SetLength(Lines, i + 16);

          Lines[i].PolID := Q1.FieldByName('PolID').AsInteger;
          Lines[i].PolicyCode := fParams.PolicyCode;
          Lines[i].WrtPremID := Q1.FieldByName('WrtPremID').AsInteger;
          Lines[i].Line_Num := Q1.FieldByName('Line_Num').AsInteger;
          Lines[i].FrmID := Q1.FieldByName('sFRM_ID').AsInteger;
          Lines[i].Level_Name := lCov.Level_Name;
          Lines[i].TrnType := strToTransType(Q1.FieldByName('TransactionType').AsString);
          Lines[i].Level := level.Index;
          Lines[i].PRL_ID := lCov.PRL_ID;
          Lines[i].DeletedSR := Q1.FieldByName('DeletedSR').AsBoolean;
          Lines[i].Inception_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('Inception_Date').AsDateTime));
          Lines[i].Expiration_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('Expiration_Date').AsDateTime));
          Lines[i].Effective_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('Effective_Date').AsDateTime));
          Lines[i].Entry_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('Entry_Date').AsDateTime));
          Lines[i].Accounting_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('Accounting_Date').AsDateTime));
          Lines[i].PremSourceID := Q1.FieldByName('PremSourceID').AsInteger;
          Lines[i].AnnualPremium := Q1.FieldByName('AnnualPremium').AsCurrency;
          Lines[i].AnnualFees := Q1.FieldByName('AnnualFees').AsCurrency;
          Lines[i].RoundWpTo := lCov.RoundWpTo;
          Lines[i].RoundEpTo := lCov.RoundEpTo;
          Lines[i].ProRateRoundTo := lCov.ProRateRoundTo;
          Lines[i].ProRateEffDate := lCov.ProRateEffDate;
          Lines[i].WPL_TableName := level.WPL_TableName;
          Lines[i].EPL_TableName := level.EPL_TableName;
          Lines[i].WPL_Mandatory := lCov.WPL_Mandatory;
          Lines[i].EPL_Mandatory := lCov.EPL_Mandatory;
          Lines[i].WPL_ID := Q1.FieldByName('WPL_ID').AsVariant;
          Lines[i].EPL_ID := Q1.FieldByName('EPL_ID').AsVariant;
          Lines[i].SetEarnDateOld := Q1.FieldByName('ErnDateOpt').AsInteger = 1;
          Lines[i].LevelRecID := Q1.FieldByName('LevelRecID').AsString;
          Lines[i].FullyEarn := lCov.FullyEarn;

          if lCov.PD_ShortRatePercName > '' then
            Lines[i].ShortRatePerc := Q1.FieldByName('ShortRatePerc').AsFloat
          else
            Lines[i].ShortRatePerc := 0;

          if lCov.PD_MinWPAmtName > '' then
            Lines[i].MinWPAmt := Q1.FieldByName('MinWPAmt').AsFloat
          else
            Lines[i].MinWPAmt := 0;

          Lines[i].ForcedWPAmt := Q1.FieldByName('ForcedWPAmt').AsFloat;

          if lCov.PD_MinRetainedWPAmtName > '' then begin
            Lines[i].MinRetainedWPAmt := Q1.FieldByName('MinRetainedWPAmt').AsFloat;
            Lines[i].WrittenTotal := Q1.FieldByName('WrittenTotal').AsFloat;
          end else begin
            Lines[i].MinRetainedWPAmt := 0;
            Lines[i].WrittenTotal := 0;
          end;

          //this is to divide the loaded records by transactions and risk (levels)
          if LastLine = 0 then begin
            LastLine := Lines[i].Line_Num;

            cov.Name := Lines[i].Level_Name;
            cov.Inception_Date := Lines[i].Inception_Date;
            cov.Expiration_Date := Lines[i].Expiration_Date;
            cov.RoundWpTo := Lines[i].RoundWpTo;
            cov.RoundEpTo := Lines[i].RoundEpTo; //28093
            cov.ProRateEffDate := Lines[i].ProRateEffDate;
            cov.ProRateRoundTo := Lines[i].ProRateRoundTo;
            cov.CalculationType := 1;
            cov.RunWPSum := level.RunWPSum;
            cov.RunEPSum := level.RunEPSum;
            cov.WrittenTotal := Lines[i].WrittenTotal;
            cov.FullyEarn := Lines[i].FullyEarn;
          end;

          if LastLine <> Lines[i].Line_Num then begin
            LevelIndex := 0;
            LastLine := Lines[i].Line_Num;
          end;

          inc(LevelIndex);
          Lines[i].LevelIndex := LevelIndex;

          //get the max level index...
          if MaxIndexCount < LevelIndex then
            MaxIndexCount := LevelIndex;

          Self.Debug('Line ' + IntToStr(i) + ':', serializeLevelLine(Lines[i]));
          Inc(i);
          Q1.Next;
        end;
        Q1.Active := false;



        fWithAdditionalTransaction := addRecID > 0;
        if fWithAdditionalTransaction then begin
          Q1.SQL.Clear;
          Q1.SQL.Add('select POL.' + lCov.PD_ID_Name + ' as PolID, 0 as WrtPremID, POL.PD_TransOrder as Line_Num, ');
          if lCov.PS_LevelRecID > '' then
            Q1.SQL.Add('PS.' + lCov.PS_LevelRecID + ' as LevelRecID, ') //25493
          else Q1.SQL.Add(''''' as LevelRecID, ');
          if lCov.PS_Deleted_Name > '' then
            Q1.SQL.Add('isnull(PS.' + lCov.PS_Deleted_Name + ', 0) as DeletedSR, ')
          else
            Q1.SQL.Add('cast(0 as bit) as DeletedSR, ');
          Q1.SQL.Add('POL.sFRM_ID, TRN.sPTRN_TransType as TransactionType, ');
          Q1.SQL.Add('POL.' + lCov.PD_IncDate_Name + ' as Inception_Date, ');
          Q1.SQL.Add('POL.' + lCov.PD_ExpDate_Name + ' as	Expiration_Date, ');
          Q1.SQL.Add('POL.' + lCov.PD_EffDate_Name + ' as Effective_Date, ');
          Q1.SQL.Add('POL.' + lCov.PD_EntryDate_Name + ' as Entry_Date, ');
          Q1.SQL.Add('POL.' + lCov.PD_AccDate_Name + ' as Accounting_Date, ');

          if lCov.PD_ShortRatePercName > '' then
            Q1.SQL.Add('POL.' + lCov.PD_ShortRatePercName + ' as ShortRatePerc, ');

          if lCov.PD_MinWPAmtName > '' then
            Q1.SQL.Add('isnull(POL.' + lCov.PD_MinWPAmtName + ', 0) as MinWPAmt, ');

          if lCov.PD_ForcedWPAmtName > '' then
            Q1.SQL.Add('isnull(POL.' + lCov.PD_ForcedWPAmtName + ', ' + sInactiveFlag + ') as ForcedWPAmt, ')
          else
            Q1.SQL.Add(sInactiveFlag + ' as ForcedWPAmt, ');

          if lCov.PD_MinRetainedWPAmtName > '' then
            Q1.SQL.Add('POL.' + lCov.PD_MinRetainedWPAmtName + ' as MinRetainedWPAmt, A.WP_Written_Premium as WrittenTotal, ');

          Q1.SQL.Add('PS.' + lCov.PS_ID_Name + ' as PremSourceID, ');
          Q1.SQL.Add('PS.' + lCov.PS_Prem_Name + ' as AnnualPremium, ');
          Q1.SQL.Add('PS.' + lCov.PS_Fee_Name + ' as AnnualFees, ');
          if wpOnly then
            Q1.SQL.Add('0 as EPL_ID, ')
          else
            Q1.SQL.Add('isnull(EPL.EPL_ID, 0) as EPL_ID, ');
          Q1.SQL.Add('isnull(WPL.WPL_ID, 0) as WPL_ID ');
          if lCov.EP_ErnDateOptName > '' then
            Q1.SQL.Add(', isnull(POL.' + lCov.EP_ErnDateOptName + ', 0) as ErnDateOpt ') //25934
          else
            Q1.SQL.Add(', 0 as ErnDateOpt '); //25934

          Q1.SQL.Add('from [' + lCov.PD_Table + '] as POL with (NOLOCK) ');
          Q1.SQL.Add('join [System_PolicyTransactions] as TRN with (NOLOCK) on TRN.sPTRN_ID = POL.sPTRN_ID ');

          if lCov.PS_AsFunct then
            Q1.SQL.Add('join ' + lCov.PS_Table + ' as PS ') //27464 table as function
          else
            Q1.SQL.Add('join [' + lCov.PS_Table + '] as PS with (NOLOCK) ');

          Q1.SQL.Add(' on PS.' + lCov.PS_PolID_Name + ' = POL.' + lCov.PD_ID_Name + ' ');
          Q1.SQL.Add(' and PS.' + lCov.PS_PolicyCodeName + ' = POL.' + lCov.PD_PolicyCodeName + ' ');
          Q1.SQL.Add('left outer join [' + level.WPL_TableName + '] as WPL with (NOLOCK) ');
          Q1.SQL.Add(' on WPL.WPL_RecordID = POL.' + lCov.PD_ID_Name + ' ');
          Q1.SQL.Add(' and WPL.WPL_Line_Num = POL.PD_TransOrder ');
          Q1.SQL.Add(' and WPL.WPL_Level_Name = ''' + lCov.Level_Name + ''' ');
          Q1.SQL.Add(' and WPL.WPL_PremSourceID = PS.' + lCov.PS_ID_Name + ' ');
          if lCov.PS_LevelRecID > '' then
            Q1.SQL.Add(' and WPL.WPL_UniqueID = PS.' + lCov.PS_LevelRecID + ' ');
          if not wpOnly then begin
            Q1.SQL.Add('left outer join [' + level.EPL_TableName + '] as EPL with (NOLOCK) ');
            Q1.SQL.Add(' on EPL.EPL_RecordID = POL.' + lCov.PD_ID_Name + ' ');
            Q1.SQL.Add(' and EPL.EPL_Line_Num = POL.PD_TransOrder ');
            Q1.SQL.Add(' and EPL.EPL_Level_Name = ''' + lCov.Level_Name + ''' ');
            Q1.SQL.Add(' and EPL.EPL_PremSourceID = PS.' + lCov.PS_ID_Name + ' ');
            if lCov.PS_LevelRecID > '' then
              Q1.SQL.Add(' and EPL.EPL_UniqueID = PS.' + lCov.PS_LevelRecID + ' ');
            Q1.SQL.Add(' and EPL.EPL_Premium_Date = ''' + FormatDateTime('MM/DD/YYYY', fCalcDate) + ''' ');
          end;
          Q1.SQL.Add('where POL.' + lCov.PD_ID_Name + ' = :RECID ');
          Q1.SQL.Add('and POL.' + lCov.PD_PolicyCodeName + ' = :POL');

          {LK: This is just quick dirty fix!
            We need to redesign how levels, its coverages and transactions are being loaded, used and passed to the non-level calculation!
            Q1.SQL.Add('order by POL.PD_TransOrder, LevelRecID');
          }
          Q1.SQL.Add('order by POL.PD_TransOrder, ' + lCov.PS_Deleted_Name + ' DESC, LevelRecID');


          Q1.ParamByName('RECID').AsInteger := addRecID;
          Q1.ParamByName('POL').AsString := fParams.PolicyCode;

          Self.Debug('Query LoadAdditionalLevelLine ' + IntToStr(l) + ',' + IntToStr(c) + ':', Q1.SQL.Text, 'LoadAdditionalLevelLine');
          Self.Debug('Query LoadAdditionalLevelLine ' + IntToStr(l) + ',' + IntToStr(c) + ':', serializeQueryParams(Q1));

          Q1.Active := true;

          SetLength(Lines, i + 16);
          while not Q1.EOF do begin
            if i = Length(Lines) then
              SetLength(Lines, i + 16);

            Lines[i].PolID := Q1.FieldByName('PolID').AsInteger;
            Lines[i].PolicyCode := fParams.PolicyCode;
            Lines[i].WrtPremID := Q1.FieldByName('WrtPremID').AsInteger;
            Lines[i].Line_Num := Q1.FieldByName('Line_Num').AsInteger;
            Lines[i].FrmID := Q1.FieldByName('sFRM_ID').AsInteger;
            Lines[i].Level_Name := lCov.Level_Name;
            Lines[i].TrnType := strToTransType(Q1.FieldByName('TransactionType').AsString);
            Lines[i].Level := level.Index;
            Lines[i].PRL_ID := lCov.PRL_ID;
            Lines[i].DeletedSR := Q1.FieldByName('DeletedSR').AsBoolean;
            Lines[i].Inception_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('Inception_Date').AsDateTime));
            Lines[i].Expiration_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('Expiration_Date').AsDateTime));
            Lines[i].Effective_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('Effective_Date').AsDateTime));
            Lines[i].Entry_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('Entry_Date').AsDateTime));
            Lines[i].Accounting_Date := StrToDateTime(FormatDateTime('mm/dd/yyyy', Q1.FieldByName('Accounting_Date').AsDateTime));
            Lines[i].PremSourceID := Q1.FieldByName('PremSourceID').AsInteger;
            Lines[i].AnnualPremium := Q1.FieldByName('AnnualPremium').AsCurrency;
            Lines[i].AnnualFees := Q1.FieldByName('AnnualFees').AsCurrency;
            Lines[i].RoundWpTo := lCov.RoundWpTo;
            Lines[i].RoundEpTo := lCov.RoundEpTo;
            Lines[i].ProRateRoundTo := lCov.ProRateRoundTo;
            Lines[i].ProRateEffDate := lCov.ProRateEffDate;
            //Lines[i].WPL_TableName := lCov.WPL_TableName;
            //Lines[i].EPL_TableName := lCov.EPL_TableName;
            Lines[i].WPL_Mandatory := lCov.WPL_Mandatory;
            Lines[i].EPL_Mandatory := lCov.EPL_Mandatory;
            Lines[i].WPL_ID := Q1.FieldByName('WPL_ID').AsVariant;
            Lines[i].EPL_ID := Q1.FieldByName('EPL_ID').AsVariant;
            Lines[i].SetEarnDateOld := Q1.FieldByName('ErnDateOpt').AsInteger = 1;
            Lines[i].LevelRecID := Q1.FieldByName('LevelRecID').AsString;
            Lines[i].FullyEarn := lCov.FullyEarn;

            if lCov.PD_ShortRatePercName > '' then
              Lines[i].ShortRatePerc := Q1.FieldByName('ShortRatePerc').AsFloat
            else
              Lines[i].ShortRatePerc := 0;

            if lCov.PD_MinWPAmtName > '' then
              Lines[i].MinWPAmt := Q1.FieldByName('MinWPAmt').AsFloat
            else
              Lines[i].MinWPAmt := 0;

            Lines[i].ForcedWPAmt := Q1.FieldByName('ForcedWPAmt').AsFloat;

            if lCov.PD_MinRetainedWPAmtName > '' then begin
              Lines[i].MinRetainedWPAmt := Q1.FieldByName('MinRetainedWPAmt').AsFloat;
              Lines[i].WrittenTotal := Q1.FieldByName('WrittenTotal').AsFloat;
            end else begin
              Lines[i].MinRetainedWPAmt := 0;
              Lines[i].WrittenTotal := 0;
            end;

            //this is to divide the loaded records by transactions and risk (levels)
            if LastLine = 0 then begin
              LastLine := Lines[i].Line_Num;

              cov.Name := Lines[i].Level_Name;
              cov.Inception_Date := Lines[i].Inception_Date;
              cov.Expiration_Date := Lines[i].Expiration_Date;
              cov.RoundWpTo := Lines[i].RoundWpTo;
              cov.RoundEpTo := Lines[i].RoundEpTo; //28093
              cov.ProRateEffDate := Lines[i].ProRateEffDate;
              cov.ProRateRoundTo := Lines[i].ProRateRoundTo;
              cov.CalculationType := 1;
              cov.RunWPSum := level.RunWPSum;
              cov.RunEPSum := level.RunEPSum;
              cov.WrittenTotal := Lines[i].WrittenTotal;
              cov.FullyEarn := Lines[i].FullyEarn;
            end;

            if LastLine <> Lines[i].Line_Num then begin
              LevelIndex := 0;
              LastLine := Lines[i].Line_Num;
            end;

            inc(LevelIndex);
            Lines[i].LevelIndex := LevelIndex;

            //get the max level index...
            if MaxIndexCount < LevelIndex then
              MaxIndexCount := LevelIndex;

            Self.Debug('Line ' + IntToStr(i) + ':', serializeLevelLine(Lines[i]));
            Inc(i);
            Q1.Next;
          end;
          Q1.Active := false;
        end; // if fWithAdditionalTransaction

        SetLength(Lines, i);
        Self.Debug('Loaded ' + IntToStr(i) + ' Lines.', ' ');



        //loop by level index and risk(level) arrays and load data to the premium array used for the premium calculation function...
        for LevelIndex := 1 to MaxIndexCount do begin
          t := 0;
          SetLength(cov.Transactions, t);

          for i := Low(Lines) to High(Lines) do begin
            if Lines[i].LevelIndex = LevelIndex then begin

              //Copy data into transaction array...
              trn.TrnType := Lines[i].TrnType;
              trn.Effective_Date := Lines[i].Effective_Date;
              trn.Accounting_Date := Lines[i].Accounting_Date;
              trn.Fees := Lines[i].AnnualFees;
              trn.BasePremium := Lines[i].AnnualPremium;
              trn.ShortRatePerc := Lines[i].ShortRatePerc;
              trn.MinWPAmt := Lines[i].MinWPAmt;
              trn.ForcedWPAmt := Lines[i].ForcedWPAmt;
              trn.MinRetainedWPAmt := Lines[i].MinRetainedWPAmt;
              trn.SetEarnDateOld := Lines[i].SetEarnDateOld;
              trn.WrittenTotal := Lines[i].WrittenTotal;
              trn.LineID := i; // Lines[i]

              if Lines[i].DeletedSR then begin
                Lines[i].AnnualFees := 0;
                Lines[i].AnnualPremium := 0;
              end;

              SetLength(cov.Transactions, t + 1);
              cov.Transactions[t] := trn;
              Inc(t);

              Self.Debug('Added Transaction ' + IntToStr(t) + ':', serializeTransaction(trn));
            end;
          end;

          Self.Debug('Loaded ' + IntToStr(t) + ' Transactions.', ' ');



          //Calculate level premium using calculation date (to get WP, the date is set to the future)
          i := Self.AddCoverage(cov);
          cov := Self.CalculateCoveragePremium(i);

          level.RunWPSum := cov.RunWPSum;
          level.RunEPSum := cov.RunEPSum;



          // Must be done before totals and DB updates!
          if fDoMinRetainedWP then
            Self.ApplyLevelMinRetainedWP(cov);



          // Copy the segment data back into the risk/level...
          for t := Low(cov.Transactions) to High(cov.Transactions) do begin
            trn := cov.Transactions[t];
            line := Lines[trn.LineID];
            seg := trn.Segment;

            line.Segment := seg;

            if wpOnly then begin
              if (updateDB) and ((line.Accounting_Date <= fParams.PremiumDate) or (line.WPL_Mandatory)) then
                Self.SaveWrittPremLevelTemp(line, PLTempTable, level.WPL_TableName);

              doSumarize := (seg.Visible) and (line.Accounting_Date <= fParams.PremiumDate) or (line.WPL_Mandatory);
            end else begin
              if (updateDB) then
                Self.SaveEarnedPremLevelTemp(line, PLTempTable, level.EPL_TableName);

              doSumarize := (seg.Visible) or (line.EPL_Mandatory);
            end;

            //35531 - get EP and WP totals by level
            if (doSumarize) and ((line.PolID = RecID) or (RecID = 0)) then begin
              totals.Written_Fees := totals.Written_Fees + seg.Written_Fees;
              totals.Written_Premium := totals.Written_Premium + seg.Written_Premium;
              totals.Earned_Fees := totals.Earned_Fees + seg.Earned_Fees;
              totals.Earned_Premium := totals.Earned_Premium + seg.Earned_Premium;
              totals.Unearned_Fees := totals.Unearned_Fees + seg.Unearned_Fees;
              totals.Unearned_Premium := totals.Unearned_Premium + seg.Unearned_Premium;
              totals.Written_RoundAdj := totals.Written_RoundAdj + seg.Written_RoundAdj;
              totals.Earned_RoundAdj := totals.Earned_RoundAdj + seg.Earned_RoundAdj;
              totals.Short_Rate := totals.Short_Rate + seg.Short_Rate;
            end;
          end;

          //35531 - get EP and WP totals by level
          totals.Days_Earned := DaysBetween(calcDate + 1, Lines[0].Inception_Date);
          totals.Daily_Earned := (totals.Written_Premium / Round(Lines[0].Expiration_Date - Lines[0].Inception_Date));
        end;
      end; // Coverages loop
    end; // Levels loop



    if not updateDB then begin
      result := true;
      exit;
    end;


    // Save the results from temp table into the DB
    LevelIndex := 1; //#55784 level fix - need to count the levels and save only level data from the temp table
    for l := Low(Levels) to High(Levels) do begin
      level := Levels[l];

      if (wpOnly) then begin

        //For temp table data debugging only!
        if (Assigned(fLog)) then begin
          Q1.SQL.Text := 'select * from [' + PLTempTable + '] where WPL_Level = :LVL';
          Q1.ParamByName('LVL').AsInteger := LevelIndex;

          Self.Debug('Query LevelTempTableData ' + IntToStr(l) + ':', Q1.SQL.Text, 'LevelTempTableData');
          Self.Debug('Query LevelTempTableData ' + IntToStr(l) + ':', serializeQueryParams(Q1));

          Q1.Active := true;
          s := '';
          while not Q1.EOF do begin
            for i := 0 to Q1.Fields.Count - 1 do
              s := s + Q1.Fields[i].AsString + ', ';
            s := s + #13#10;

            Q1.Next;
          end;
          Q1.Active := false;

          Self.Debug('LevelTempTableData: ', s);
        end;

        //updates...
        Q1.SQL.Clear;
        Q1.SQL.Add('update [' + level.WPL_TableName + '] set ');
        Q1.SQL.Add('WPL_RecordID = A.WPL_RecordID, ');
        Q1.SQL.Add('WPL_PolicyCode = A.WPL_PolicyCode, ');
        Q1.SQL.Add('WPL_FrmID = A.WPL_FrmID, ');
        Q1.SQL.Add('WP_ID = A.WP_ID, ');
        Q1.SQL.Add('WPL_Line_Num = A.WPL_Line_Num, ');
        Q1.SQL.Add('WPL_Level_Name = A.WPL_Level_Name, ');
        Q1.SQL.Add('WPL_TransactionType = A.WPL_TransactionType, ');
        Q1.SQL.Add('WPL_Level = A.WPL_Level, ');
        Q1.SQL.Add('sPRL_ID = A.sPRL_ID, ');
        Q1.SQL.Add('WPL_PremSourceID = A.WPL_PremSourceID, ');
        Q1.SQL.Add('WPL_AnnualPremium = A.WPL_AnnualPremium, ');
        Q1.SQL.Add('WPL_AnnualFees = A.WPL_AnnualFees, ');
        Q1.SQL.Add('WPL_Written_Premium = A.WPL_Written_Premium, ');
        Q1.SQL.Add('WPL_Written_Fees = A.WPL_Written_Fees, ');
        Q1.SQL.Add('WPL_RoundingAdj = A.WPL_RoundingAdj, ');
        Q1.SQL.Add('WPL_Deleted = A.WPL_Deleted, ');
        Q1.SQL.Add('WPL_UniqueID = A.WPL_UniqueID, ');
        Q1.SQL.Add('WPL_Written_Premium_SR = A.WPL_Written_Premium_SR ');
        Q1.SQL.Add('from [' + PLTempTable + '] as A with(nolock) ');
        Q1.SQL.Add('where A.WPL_TableName = ''' + level.WPL_TableName + ''' ');
        Q1.SQL.Add('and ' + level.WPL_TableName + '.WPL_ID = isnull(A.WPL_ID, 0)');
        Q1.SQL.Add('and A.WPL_Level = :IND'); //#55784 level fix
        Q1.ParamByName('IND').AsInteger:= LevelIndex; //#55784 level fix
        Q1.ExecSQL;

        //inserts...
        Q1.SQL.Clear;
        Q1.SQL.Add('insert into [' + level.WPL_TableName + '] ');
        Q1.SQL.Add('(WPL_RecordID, WPL_PolicyCode, WPL_FrmID, WP_ID, WPL_Line_Num, WPL_Level_Name, WPL_TransactionType,  ');
        Q1.SQL.Add('WPL_Level, sPRL_ID, WPL_PremSourceID, WPL_AnnualPremium, WPL_AnnualFees, WPL_Written_Premium, WPL_Written_Fees,  ');
        Q1.SQL.Add('WPL_RoundingAdj, WPL_Deleted, WPL_UniqueID, WPL_Written_Premium_SR) ');
        Q1.SQL.Add('select A.WPL_RecordID, A.WPL_PolicyCode, A.WPL_FrmID, A.WP_ID, A.WPL_Line_Num, A.WPL_Level_Name, A.WPL_TransactionType,  ');
        Q1.SQL.Add('A.WPL_Level, A.sPRL_ID, A.WPL_PremSourceID, A.WPL_AnnualPremium, A.WPL_AnnualFees, A.WPL_Written_Premium, A.WPL_Written_Fees,  ');
        Q1.SQL.Add('A.WPL_RoundingAdj, A.WPL_Deleted, A.WPL_UniqueID, A.WPL_Written_Premium_SR ');
        Q1.SQL.Add('from [' + PLTempTable + '] as A with(nolock) ');
        Q1.SQL.Add('where A.WPL_TableName = ''' + level.WPL_TableName + ''' ');
        Q1.SQL.Add('and isnull(A.WPL_ID, 0) = 0 ');
        Q1.SQL.Add('and A.WPL_Level = :IND'); //#55784 level fix
        Q1.ParamByName('IND').AsInteger:= LevelIndex; //#55784 level fix
        Q1.ExecSQL;

      end else begin

        //updates...
        Q1.SQL.Clear;
        Q1.SQL.Add('update [' + level.EPL_TableName + '] set ');
        Q1.SQL.Add('EPL_RecordID = A.EPL_RecordID, ');
        Q1.SQL.Add('EPL_Premium_Date = A.EPL_Premium_Date, ');
        Q1.SQL.Add('EPL_PolicyCode = A.EPL_PolicyCode, ');
        Q1.SQL.Add('EPL_FrmID = A.EPL_FrmID, ');
        Q1.SQL.Add('WP_ID = A.WP_ID, ');
        Q1.SQL.Add('EPL_Line_Num = A.EPL_Line_Num, ');
        Q1.SQL.Add('EPL_Level_Name = A.EPL_Level_Name, ');
        Q1.SQL.Add('EPL_TransactionType = A.EPL_TransactionType, ');
        Q1.SQL.Add('EPL_Level = A.EPL_Level, ');
        Q1.SQL.Add('sPRL_ID = A.sPRL_ID, ');
        Q1.SQL.Add('EPL_PremSourceID = A.EPL_PremSourceID, ');
        Q1.SQL.Add('EPL_AnnualPremium = A.EPL_AnnualPremium, ');
        Q1.SQL.Add('EPL_AnnualFees = A.EPL_AnnualFees, ');
        Q1.SQL.Add('EPL_Days_Earned = A.EPL_Days_Earned, ');
        Q1.SQL.Add('EPL_Written_Premium = A.EPL_Written_Premium, ');
        Q1.SQL.Add('EPL_Written_Fees = A.EPL_Written_Fees, ');
        Q1.SQL.Add('EPL_Earned_Premium = A.EPL_Earned_Premium, ');
        Q1.SQL.Add('EPL_Earned_Fees = A.EPL_Earned_Fees, ');
        Q1.SQL.Add('EPL_Unearned_Premium = A.EPL_Unearned_Premium, ');
        Q1.SQL.Add('EPL_Unearned_Fees = A.EPL_Unearned_Fees, ');
        Q1.SQL.Add('EPL_Deleted = A.EPL_Deleted, ');
        Q1.SQL.Add('EPL_UniqueID = A.EPL_UniqueID, ');
        Q1.SQL.Add('EPL_RoundAdj = A.EPL_RoundAdj ');
        Q1.SQL.Add('from [' + PLTempTable + '] as A with(nolock) ');
        Q1.SQL.Add('where A.EPL_TableName = ''' + level.EPL_TableName + ''' ');
        Q1.SQL.Add('and [' + level.EPL_TableName + '].EPL_ID = isnull(A.EPL_ID, 0) ');
        Q1.SQL.Add('and A.EPL_Level = :IND'); //#55784 level fix
        Q1.ParamByName('IND').AsInteger:= LevelIndex; //#55784 level fix
        Q1.ExecSQL;

        //inserts...
        Q1.SQL.Clear;
        Q1.SQL.Add('insert into [' + level.EPL_TableName + '] ');
        Q1.SQL.Add('(EPL_RecordID, EPL_Premium_Date, EPL_PolicyCode, EPL_FrmID, WP_ID, EPL_Line_Num, EPL_Level_Name, ');
        Q1.SQL.Add('EPL_TransactionType, EPL_Level, sPRL_ID, EPL_PremSourceID, EPL_AnnualPremium, EPL_AnnualFees, ');
        Q1.SQL.Add('EPL_Days_Earned, EPL_Written_Premium, EPL_Written_Fees, EPL_Earned_Premium, EPL_Earned_Fees, ');
        Q1.SQL.Add('EPL_Unearned_Premium, EPL_Unearned_Fees, EPL_Deleted, EPL_UniqueID, EPL_RoundAdj) ');
        Q1.SQL.Add('select A.EPL_RecordID, A.EPL_Premium_Date, A.EPL_PolicyCode, A.EPL_FrmID, A.WP_ID, A.EPL_Line_Num, A.EPL_Level_Name, ');
        Q1.SQL.Add('A.EPL_TransactionType, A.EPL_Level, A.sPRL_ID, A.EPL_PremSourceID, A.EPL_AnnualPremium, A.EPL_AnnualFees, ');
        Q1.SQL.Add('A.EPL_Days_Earned, A.EPL_Written_Premium, A.EPL_Written_Fees, A.EPL_Earned_Premium, A.EPL_Earned_Fees, ');
        Q1.SQL.Add('A.EPL_Unearned_Premium, A.EPL_Unearned_Fees, A.EPL_Deleted, A.EPL_UniqueID, A.EPL_RoundAdj ');
        Q1.SQL.Add('from [' + PLTempTable + '] as A with(nolock) ');
        Q1.SQL.Add('where A.EPL_TableName = ''' + level.EPL_TableName + ''' ');
        Q1.SQL.Add('and isnull(A.EPL_ID, 0) = 0 ');
        Q1.SQL.Add('and A.EPL_Level = :IND'); //#55784 level fix
        Q1.ParamByName('IND').AsInteger:= LevelIndex; //#55784 level fix
        Q1.ExecSQL;
      end; //if (wpOnly)

      Inc(LevelIndex); //#55784 level fix
    end; // Levels loop

    result := true;
  finally
    Self.DropTempTable(PLTempTable);
    Self.Debug('END of UpdatePremiumByLevel');

    Q1.Free;
  end;
end;

function TMax_Premium.UpdateEarnedPremiumByLevel(const calcDate: TDateTime; const RecID: integer = 0): boolean;
var
  totals: TSegment;
begin
  Self.Debug('START of UpdateEarnedPremiumByLevel...');
  try
    // Get results with updating the DB!
    result := Self.UpdatePremiumByLevel(totals, RecID, 0, calcDate, true);
  finally
    Self.Debug('END of UpdateEarnedPremiumByLevel');
  end;
end;

procedure TMax_Premium.SaveWrittPremLevelTemp(line: TLine; TempTableName, WPLTableName: string);
var
  Q1: TSQLQuery;
begin
  if (line.WPL_ID = 0)
    and not (line.WPL_Mandatory) //#24728
    and (line.AnnualPremium = 0)
    and (line.Segment.Written_Premium = 0)
    and (line.AnnualFees = 0)
    and (line.Segment.Written_Fees = 0)
  then
    exit;

  Q1 := TSQLQuery.Create(nil);
  try
    Q1.SQLConnection := fSQLConnection;

    Q1.SQL.Add('insert into [' + TempTableName + '] (');
    Q1.SQL.Add(' WPL_ID, WPL_TableName, WPL_RecordID, WPL_PolicyCode, WPL_FrmID, WP_ID, WPL_Line_Num, WPL_Level_Name,');
    Q1.SQL.Add(' WPL_TransactionType, WPL_Level, sPRL_ID, WPL_PremSourceID, WPL_AnnualPremium, WPL_AnnualFees, WPL_Written_Premium,');
    Q1.SQL.Add(' WPL_Written_Fees, WPL_RoundingAdj, WPL_Deleted, WPL_UniqueID, WPL_Written_Premium_SR, ShouldDel');
    Q1.SQL.Add(') values (');
    Q1.SQL.Add(' :WPLID, :TABLE, :POLID, :POLCODE, :FRMID, :WPID, :LINENUM, :LVLNAME, :TRNTYPE, :LVLNUM,');
    Q1.SQL.Add(' :LVLID, :SRCID, :ANNPREM, :ANNFEE, :WP, :WPFEE, :WPADJ, :DELETED, :UID, :SHORT, :TODEL');
    Q1.SQL.Add(')');

    Q1.ParamByName('WPLID').AsString := IntToStr(line.WPL_ID);
    Q1.ParamByName('TABLE').AsString := WPLTableName;
    Q1.ParamByName('POLID').AsInteger := line.PolID;
    Q1.ParamByName('POLCODE').AsString := line.PolicyCode;
    Q1.ParamByName('TRNTYPE').AsString := transTypeToString(line.TrnType);
    Q1.ParamByName('FRMID').AsInteger := line.FrmID;
    Q1.ParamByName('WPID').AsInteger := line.WrtPremID;
    Q1.ParamByName('LINENUM').AsInteger := line.Line_Num;
    Q1.ParamByName('LVLNAME').AsString := line.Level_Name;
    Q1.ParamByName('LVLNUM').AsInteger := line.Level;
    Q1.ParamByName('LVLID').AsInteger := line.PRL_ID;
    Q1.ParamByName('SRCID').AsInteger := line.PremSourceID;
    Q1.ParamByName('ANNPREM').AsCurrency := line.AnnualPremium;
    Q1.ParamByName('ANNFEE').AsCurrency := line.AnnualFees;
    Q1.ParamByName('WP').AsCurrency := line.Segment.Written_Premium;
    Q1.ParamByName('WPFEE').AsCurrency := line.Segment.Written_Fees;
    Q1.ParamByName('WPADJ').AsFloat := line.Segment.Written_RoundAdj;
    Q1.ParamByName('DELETED').AsBoolean := line.DeletedSR;
    Q1.ParamByName('UID').AsString := line.LevelRecID;
    Q1.ParamByName('SHORT').AsCurrency := line.Segment.Short_Rate;
    Q1.ParamByName('TODEL').AsBoolean := False;

    Self.Debug('Query SaveWPLevelTemp:', Q1.SQL.Text, 'SaveWPLevelTemp');
    Self.Debug('Query SaveWPLevelTemp:', serializeQueryParams(Q1));

    Q1.ExecSQL;
  finally
    Q1.Free;
  end;
end;

procedure TMax_Premium.SaveEarnedPremLevelTemp(line: TLine; TempTableName, EPLTableName: string);
var
  Q1: TSQLQuery;
begin
  if (line.EPL_ID = 0)
    and not (line.Segment.Visible)
    and not (line.EPL_Mandatory)
  then
    exit;

  Q1 := TSQLQuery.Create(nil);
  try
    Q1.SQLConnection := fSQLConnection;

    Q1.SQL.Add('insert into [' + TempTableName + '] (');
    Q1.SQL.Add(' EPL_ID, EPL_TableName, EPL_RecordID, EPL_Premium_Date, EPL_PolicyCode, EPL_FrmID, WP_ID, EPL_Line_Num, EPL_Level_Name, EPL_TransactionType,');
    Q1.SQL.Add(' EPL_Level, sPRL_ID, EPL_PremSourceID, EPL_AnnualPremium, EPL_AnnualFees, EPL_Days_Earned, EPL_Written_Premium, EPL_Written_Fees,');
    Q1.SQL.Add(' EPL_Earned_Premium, EPL_Earned_Fees, EPL_Unearned_Premium, EPL_Unearned_Fees, EPL_Deleted, EPL_UniqueID, EPL_RoundAdj, ShouldDel');
    Q1.SQL.Add(') values (');
    Q1.SQL.Add(' :EPLID, :TABLE, :POLID, :PREMDATE, :POLCODE, :FRMID, :WPID, :LINENUM, :LVLNAME, :TRNTYPE, :LVLNUM, :LVLID,');
    Q1.SQL.Add(' :SRCID, :ANNPREM, :ANNFEE, :DAYSERN, :WP, :WPFEE, :EP, :EPFEE, :UP, :UPFEE, :DELETED, :UID, :EPADJ, :TODEL');
    Q1.SQL.Add(')');

    Q1.ParamByName('EPLID').AsString := IntToStr(line.EPL_ID);
    Q1.ParamByName('TABLE').AsString := EPLTableName;
    Q1.ParamByName('POLID').AsInteger := line.PolID;
    Q1.ParamByName('POLCODE').AsString := line.PolicyCode;
    Q1.ParamByName('TRNTYPE').AsString := transTypeToString(line.TrnType);
    Q1.ParamByName('PREMDATE').AsString := FormatDateTime('MM/DD/YYYY', fCalcDate);
    Q1.ParamByName('FRMID').AsInteger := line.FrmID;
    Q1.ParamByName('WPID').AsInteger := line.WrtPremID;
    Q1.ParamByName('LINENUM').AsInteger := line.Line_Num;
    Q1.ParamByName('LVLNAME').AsString := line.Level_Name;
    Q1.ParamByName('LVLNUM').AsInteger := line.Level;
    Q1.ParamByName('LVLID').AsInteger := line.PRL_ID;
    Q1.ParamByName('SRCID').AsInteger := line.PremSourceID;
    Q1.ParamByName('ANNPREM').AsCurrency := line.AnnualPremium;
    Q1.ParamByName('ANNFEE').AsCurrency := line.AnnualFees;
    Q1.ParamByName('DAYSERN').AsInteger := line.Segment.Days_Earned;
    Q1.ParamByName('WP').AsCurrency := line.Segment.Written_Premium;
    Q1.ParamByName('WPFEE').AsCurrency := line.Segment.Written_Fees;
    Q1.ParamByName('EP').AsCurrency := line.Segment.Earned_Premium;
    Q1.ParamByName('EPFEE').AsCurrency := line.Segment.Earned_Fees;
    Q1.ParamByName('EPADJ').AsCurrency := line.Segment.Earned_RoundAdj;
    Q1.ParamByName('UP').AsCurrency := line.Segment.Unearned_Premium;
    Q1.ParamByName('UPFEE').AsCurrency := line.Segment.Unearned_Fees;
    Q1.ParamByName('DELETED').AsBoolean := line.DeletedSR;
    Q1.ParamByName('UID').AsString := line.LevelRecID;
    Q1.ParamByName('TODEL').AsBoolean := (line.EPL_ID > 0) and not (line.Segment.Visible) and not (line.EPL_Mandatory);

    Self.Debug('Query SaveEPLevelTemp:', Q1.SQL.Text, 'SaveEPLevelTemp');
    Self.Debug('Query SaveEPLevelTemp:', serializeQueryParams(Q1));

    Q1.ExecSQL;
  finally
    Q1.Free;
  end;
end;

function CustomPremiumCalculator(const calcDate: TDateTime; const CalculationType: integer; var ErrMsg: string; var RunningWPSum, RunningEPSum: double; PremEntryData: TPremDataEntry): TPremDataResult; //#37519
//Premium calculation function based on entry record array - no table data access
//Created 03/23/2015 - MJ
var
  params: TPremium_Params;
  Prem: TMax_Premium;
  i: integer;
  tmp: TPremDataResult;
  cov: TCoverage;
  seg: TSegment;
begin
  try
    if Length(PremEntryData) = 0 then
      raise Exception.Create('Premium data entry record cannot be blank!');

    //check and set default calculation type if option invalid...
    cov.CalculationType := CalculationType;
    if (cov.CalculationType < 1) or (cov.CalculationType > 2) then
      cov.CalculationType := 1;

    Prem := TMax_Premium.Create(params);
    try
      Prem.fCalcDate := calcDate;

      //loop entry data array and add data into the WP calculation array
      SetLength(cov.Transactions, Length(PremEntryData));
      for i := low(PremEntryData) to high(PremEntryData) do begin
        cov.Transactions[i].TrnType := strToTransType(PremEntryData[i].TransType);
        cov.Transactions[i].Effective_Date := StrToDateTime(PremEntryData[i].EffectiveDate);
        cov.Transactions[i].Accounting_Date := StrToDateTime(PremEntryData[i].AccountingDate);
        cov.Transactions[i].Fees := StrToCurr(PremEntryData[i].FullyEarnedPrem);
        cov.Transactions[i].BasePremium := StrToCurr(PremEntryData[i].ProratedPrem);
        cov.Transactions[i].ShortRatePerc := StrToFloat(PremEntryData[i].ShortRatePerc);
        cov.Transactions[i].MinWPAmt := StrToCurr(PremEntryData[i].MinWPAmt);
        cov.Transactions[i].ForcedWPAmt := StrToCurr(PremEntryData[i].ForcedWPAmt);
        cov.Transactions[i].MinRetainedWPAmt := StrToCurr(PremEntryData[i].MinRetainedWPAmt);
        cov.Transactions[i].SetEarnDateOld := PremEntryData[i].UseEarnDateOld = 1;
      end;

      cov.Inception_Date := StrToDateTime(PremEntryData[0].InceptionDate);
      cov.Expiration_Date := StrToDateTime(PremEntryData[0].ExpirationDate);
      cov.RoundWpTo := StrToFloat(PremEntryData[0].WPRoundTo);
      cov.RoundEpTo := StrToFloat(PremEntryData[0].EPRoundTo);
      cov.ProRateEffDate := StrToDateTime(PremEntryData[0].ProRateEffDate);
      cov.ProRateRoundTo := StrToFloat(PremEntryData[0].ProRateRoundTo);
      cov.RunWPSum := RunningWPSum;
      cov.RunEPSum := RunningEPSum;

      

      i := Prem.AddCoverage(cov);
      cov := Prem.CalculateCoveragePremium(i);

      RunningWPSum := cov.RunWPSum;
      RunningEPSum := cov.RunEPSum;



      //loop the calculation result array of record and set the function result...
      SetLength(tmp, Length(cov.Transactions));
      for i := Low(cov.Transactions) to High(cov.Transactions) do begin
        seg := cov.Transactions[i].Segment;
        
        tmp[i].WrittenPrem := FloatToStr(seg.Written_Premium);
        tmp[i].WrittenFees := FloatToStr(seg.Written_Fees);
        tmp[i].WPShortRate := FloatToStr(seg.Short_Rate);
        tmp[i].WrittenFactor := FloatToStr(seg.Written_Factor);
        tmp[i].ProRateFactor := FloatToStr(seg.ProRate_Factor);
        tmp[i].EarnedPrem := FloatToStr(seg.Earned_Premium);
        tmp[i].EarnedFees := FloatToStr(seg.Earned_Fees);
        tmp[i].UnearnPrem := FloatToStr(seg.Unearned_Premium);
        tmp[i].UnearnFees := FloatToStr(seg.Unearned_Fees);
        tmp[i].DaysEarned := seg.Days_Earned;
        tmp[i].DailyEarned := FloatToStr(seg.Daily_Earned);
        tmp[i].WPRoundAdj := FloatToStr(seg.Written_RoundAdj);
        tmp[i].EPRoundAdj := FloatToStr(seg.Earned_RoundAdj);
        if seg.Visible then
          tmp[i].Visible := 1
        else
          tmp[i].Visible := 0;
      end;

      Result := tmp;
    finally
      Prem.Free
    end;
  except
    on E: Exception do
      ErrMsg := 'Custom Premium Calculation Error: ' + E.Message;
  end;
end;

function UpdateWrittenPremium(const LOBID: integer; const PolicyCode: string; const SQLConnection: TSQLConnection): boolean;
var
  pp: TPremium_Params;
begin
  pp := getBlankPremiumParams;

  pp.LOBID := LOBID;
  pp.PolicyCode := PolicyCode;

  Result := UpdateWrittenPremiumEx(pp, SQLConnection);
end;

function UpdateWrittenPremiumEx(params: TPremium_Params; const SQLConnection: TSQLConnection): boolean;
{
 Function     : calculate the policy written premium and update the written premium table
 Create date  : 03/06/2009
}
var
  Premium: TMax_Premium;
  Coverages: TCoverages;
  cov: TCoverage;
  trn: TTransaction;
  seg: TSegment;
  i, j, WrPremID: Integer;
  Q1, Q2: TSQLQuery;
  NeedUpdate: boolean;
  PL_Prefix, PLTempTable: string;
  ProcessTrOrdFix: boolean;
begin
  Result := False;

  Premium := TMax_Premium.Create(params);
  Q1 := TSQLQuery.Create(nil);
  try
    Premium.Debug('START of UpdateWrittenPremiumEx...');

    Premium.SQLConnection := SQLConnection;
    Q1.SQLConnection := SQLConnection;

    Coverages := Premium.GetCoverages(0);
    if Length(Coverages) = 0 then
      Exit;

    //this can be used only for WP sumarry to filter out transaction with future acc. date #36898
    //we still calculate as for end of time but then we use this date condition for the WP summary
    if Round(params.PremiumDate) <= 0 then
      params.PremiumDate := StrToDateTime('01/01/2100');

    PLTempTable := Premium.MakeTempTableName;

    Q1.SQL.Clear;
    Q1.SQL.Add('create table ' + PLTempTable + '( ');
    Q1.SQL.Add('[WP_ID] [bigint] NULL, ');
    Q1.SQL.Add('[WP_RecordID] [int] NULL, ');
    Q1.SQL.Add('[WP_PolicyCode] [varchar](25) NULL, ');
    Q1.SQL.Add('[WP_Line_Num] [int] NULL, ');
    Q1.SQL.Add('[WP_Prem_Name] [varchar](50) NULL, ');
    Q1.SQL.Add('[WP_TransactionType] [varchar](3) NULL, ');
    Q1.SQL.Add('[WP_Inception_Date] [datetime] NULL, ');
    Q1.SQL.Add('[WP_Entry_Date] [datetime] NULL, ');
    Q1.SQL.Add('[WP_Accounting_Date] [datetime] NULL, ');
    Q1.SQL.Add('[WP_AnnualPremium] [money] NULL, ');
    Q1.SQL.Add('[WP_AnnualFees] [money] NULL, ');
    Q1.SQL.Add('[WP_Written_Premium] [money] NULL, ');
    Q1.SQL.Add('[WP_Written_Fees] [money] NULL, ');
    Q1.SQL.Add('[WP_DailyEarned] [money] NULL, ');
    Q1.SQL.Add('[WP_RoundAdj] [money] NULL, ');
    Q1.SQL.Add('[WP_TransNotes] [varchar](max) NULL, ');
    Q1.SQL.Add('[WP_Written_Premium_SR] [money] NULL, ');
    Q1.SQL.Add('[WP_ProRate_Factor] [float] NULL )');
    Q1.ExecSQL;

    for i := low(Coverages) to high(Coverages) do begin
      cov := Coverages[i];

      for j := low(cov.Transactions) to high(cov.Transactions) do begin
        trn := cov.Transactions[j];

        if trn.Accounting_Date <= params.PremiumDate then begin
          seg := trn.Segment;

          //#24728
          if (cov.WP_Mandatory) or (trn.BasePremium <> 0) or (trn.Fees <> 0) or (seg.Written_Premium <> 0) or (seg.Written_Fees <> 0) then begin

            Q1.SQL.Clear;
            Q1.SQL.Add('insert into [' + PLTempTable + '] (');
            Q1.SQL.Add(' WP_ID, WP_RecordID, WP_PolicyCode, WP_Line_Num, WP_Prem_Name, WP_TransactionType, WP_Inception_Date,');
            Q1.SQL.Add(' WP_Entry_Date, WP_Accounting_Date, WP_AnnualPremium, WP_AnnualFees, WP_Written_Premium, WP_Written_Fees,');
            Q1.SQL.Add(' WP_RoundAdj, WP_DailyEarned, WP_TransNotes, WP_Written_Premium_SR, WP_ProRate_Factor'); //19079
            Q1.SQL.Add(') values (');
            Q1.SQL.Add(' :PREMID, :POLID, :POLCODE, :LINENUM, :PREMNAME, :TRNTYPE, :INCDATE, :ENTDATE, :ACCDATE,');
            Q1.SQL.Add(' :ANNPREM, :ANNFEE, :WP, :WPFEE, :WPADJ, :DLYERN, :NOTES, :SHORT, :PRORATE');
            Q1.SQL.Add(')');

            Q1.ParamByName('POLID').AsInteger := trn.PolicyID;
            Q1.ParamByName('POLCODE').AsString := params.PolicyCode;
            Q1.ParamByName('TRNTYPE').AsString := transTypeToString(trn.TrnType);
            Q1.ParamByName('LINENUM').AsInteger := trn.Line_Num;
            Q1.ParamByName('PREMID').AsString := IntToStr(trn.PremiumID);
            Q1.ParamByName('PREMNAME').AsString := cov.Name;
            Q1.ParamByName('INCDATE').AsString := DateTimeToStr(trn.Inception_Date);
            Q1.ParamByName('ENTDATE').AsString := DateTimeToStr(trn.Entry_Date);
            Q1.ParamByName('ACCDATE').AsString := DateTimeToStr(trn.Accounting_Date);
            Q1.ParamByName('ANNPREM').AsCurrency := trn.BasePremium;
            Q1.ParamByName('ANNFEE').AsCurrency := trn.Fees;
            Q1.ParamByName('WP').AsCurrency := seg.Written_Premium;
            Q1.ParamByName('WPFEE').AsCurrency := seg.Written_Fees;
            Q1.ParamByName('WPADJ').AsCurrency := seg.Written_RoundAdj;
            Q1.ParamByName('DLYERN').AsCurrency := seg.Daily_Earned;
            Q1.ParamByName('NOTES').AsString := trn.Notes;
            Q1.ParamByName('SHORT').AsCurrency := seg.Short_Rate;
            Q1.ParamByName('PRORATE').AsFloat := seg.ProRate_Factor;

            Premium.Debug('Query InsertWP:', Q1.SQL.Text, 'InsertWP');
            Premium.Debug('Query InsertWP:', serializeQueryParams(Q1));

            Q1.ExecSQL;
          end;
        end;
      end; //for j := low(Coverages[i].Transactions) to high(Coverages[i].Transactions) do begin
    end; // for I := low(Coverages) to high(Coverages) do begin

    //now post the data from temp table into the WP table
    //updates...
    Q1.SQL.Clear;
    Q1.SQL.Add('update [' + Coverages[0].WPTableName + '] set ');
    Q1.SQL.Add('WP_RecordID = A.WP_RecordID, ');
    Q1.SQL.Add('WP_PolicyCode = A.WP_PolicyCode, ');
    Q1.SQL.Add('WP_Line_Num = A.WP_Line_Num, ');
    Q1.SQL.Add('WP_Prem_Name = A.WP_Prem_Name, ');
    Q1.SQL.Add('WP_TransactionType = A.WP_TransactionType, ');
    Q1.SQL.Add('WP_Inception_Date = A.WP_Inception_Date, ');
    Q1.SQL.Add('WP_Entry_Date = A.WP_Entry_Date, ');
    Q1.SQL.Add('WP_Accounting_Date = A.WP_Accounting_Date, ');
    Q1.SQL.Add('WP_AnnualPremium = A.WP_AnnualPremium, ');
    Q1.SQL.Add('WP_AnnualFees = A.WP_AnnualFees, ');
    Q1.SQL.Add('WP_Written_Premium = A.WP_Written_Premium, ');
    Q1.SQL.Add('WP_Written_Fees = A.WP_Written_Fees, ');
    Q1.SQL.Add('WP_DailyEarned = A.WP_DailyEarned, ');
    Q1.SQL.Add('WP_RoundAdj = A.WP_RoundAdj, ');
    Q1.SQL.Add('WP_TransNotes = A.WP_TransNotes, ');
    Q1.SQL.Add('WP_Written_Premium_SR = A.WP_Written_Premium_SR, ');
    Q1.SQL.Add('WP_ProRate_Factor = A.WP_ProRate_Factor ');
    Q1.SQL.Add('from [' + PLTempTable + '] as A with(nolock) ');
    Q1.SQL.Add('where ' + Coverages[0].WPTableName + '.WP_ID = isnull(A.WP_ID, 0) ');
    Q1.ExecSQL;

    // Inserts...
    Q1.SQL.Clear;
    Q1.SQL.Add('insert into [' + Coverages[0].WPTableName + '] ');
    Q1.SQL.Add('(WP_RecordID, WP_PolicyCode, WP_Line_Num, WP_Prem_Name, WP_TransactionType, WP_Inception_Date, ');
    Q1.SQL.Add('WP_Entry_Date, WP_Accounting_Date, WP_AnnualPremium, WP_AnnualFees, WP_Written_Premium, ');
    Q1.SQL.Add('WP_Written_Fees, WP_DailyEarned, WP_RoundAdj, WP_TransNotes, WP_Written_Premium_SR, WP_ProRate_Factor) ');
    Q1.SQL.Add('select A.WP_RecordID, A.WP_PolicyCode, A.WP_Line_Num, A.WP_Prem_Name, A.WP_TransactionType, A.WP_Inception_Date, ');
    Q1.SQL.Add('A.WP_Entry_Date, A.WP_Accounting_Date, A.WP_AnnualPremium, A.WP_AnnualFees, A.WP_Written_Premium, ');
    Q1.SQL.Add('A.WP_Written_Fees, A.WP_DailyEarned, A.WP_RoundAdj, A.WP_TransNotes, A.WP_Written_Premium_SR, A.WP_ProRate_Factor ');
    Q1.SQL.Add('from [' + PLTempTable + '] as A with(nolock) ');
    Q1.SQL.Add('where isnull(A.WP_ID, 0) = 0 ');
    Q1.ExecSQL;

    Result := True;
  finally
    Premium.DropTempTable(PLTempTable);
    Premium.Debug('END of UpdateWrittenPremiumEx.');

    Premium.Free;
    Q1.Free;
  end;
end; //end function UpdateWrittenPremiumEx   

function UpdateEarnedPremium(const LOBID: integer; const PolicyCode: string; const PremiumDate: TDateTime; const SQLConnection: TSQLConnection): boolean;
var
  pp: TPremium_Params;
begin
  pp := getBlankPremiumParams;

  pp.LOBID := LOBID;
  pp.PolicyCode := PolicyCode;

  result := UpdateEarnedPremiumEx(pp, PremiumDate, SQLConnection);
end;

function UpdateEarnedPremiumEx(const params: TPremium_Params; const PremiumDate: TDateTime; const SQLConnection: TSQLConnection): boolean;
{
 Function     : calculate the policy earned premium and update the earned premium table
 Create date  : MJ 08/07/2009
}
var
  Premium: TMax_Premium;
  cov: TCoverage;
  trn: TTransaction;
  seg: TSegment;
  i, j: Integer;
  Q1: TSQLQuery;
  PLTempTable: string;
begin
  result := False;

  Premium := TMax_Premium.Create(params);
  Q1 := TSQLQuery.Create(nil);
  try
    Premium.SQLConnection := SQLConnection;
    Q1.SQLConnection := SQLConnection;

    if not Premium.GetEarnedPremiumByPolicyCode(PremiumDate, 0) then
      Exit;

    PLTempTable := Premium.MakeTempTableName;

    Q1.SQL.Clear;
    Q1.SQL.Add('create table ' + PLTempTable + '( ');
    Q1.SQL.Add('[EP_RecordID] [bigint] NULL, ');
    Q1.SQL.Add('[EP_Premium_Date] [datetime] NULL, ');
    Q1.SQL.Add('[EP_Days_Earned] [int] NULL, ');
    Q1.SQL.Add('[EP_PolicyCode] [varchar](25) NULL, ');
    Q1.SQL.Add('[EP_Line_Num] [int] NULL, ');
    Q1.SQL.Add('[EP_Prem_Name] [varchar](50) NULL, ');
    Q1.SQL.Add('[EP_TransactionType] [varchar](3) NULL, ');
    Q1.SQL.Add('[EP_Inception_Date] [datetime] NULL, ');
    Q1.SQL.Add('[EP_Effective_Date] [datetime] NULL, ');
    Q1.SQL.Add('[EP_Entry_Date] [datetime] NULL, ');
    Q1.SQL.Add('[EP_Accounting_Date] [datetime] NULL, ');
    Q1.SQL.Add('[EP_AnnualPremium] [money] NULL, ');
    Q1.SQL.Add('[EP_AnnualFees] [money] NULL, ');
    Q1.SQL.Add('[EP_Written_Premium] [money] NULL, ');
    Q1.SQL.Add('[EP_Written_Fees] [money] NULL, ');
    Q1.SQL.Add('[EP_Earned_Premium] [money] NULL, ');
    Q1.SQL.Add('[EP_Earned_Fees] [money] NULL, ');
    Q1.SQL.Add('[EP_Unearned_Premium] [money] NULL, ');
    Q1.SQL.Add('[EP_Unearned_Fees] [money] NULL, ');
    Q1.SQL.Add('[EP_RoundAdj] [money] NULL) ');
    Q1.ExecSQL;

    //loop for the premiums (premium names)...
    for i := low(Premium.Coverages) to high(Premium.Coverages) do begin
      cov := Premium.Coverages[i];

      if cov.CalcRuleName = '' then begin  //we delete and insert only premiums not calculated by custom VRM
        Q1.SQL.Clear;
        Q1.SQL.Add(' delete from [' + cov.EPTableName + ']');
        Q1.SQL.Add(' where EP_Premium_Date = :PRDTE ');
        Q1.SQL.Add(' and EP_PolicyCode = :POL ');
        Q1.SQL.Add(' and EP_Prem_Name = :PRNM');
        Q1.ParamByName('PRDTE').AsString := FormatDateTime('MM/DD/YYYY', PremiumDate);
        Q1.ParamByName('POL').AsString := params.PolicyCode;
        Q1.ParamByName('PRNM').AsString := cov.Name;
        Q1.ExecSQL;


        //loop for the premium records...
        for j := low(cov.Transactions) to high(cov.Transactions) do begin
          trn := cov.Transactions[j];
          seg := trn.Segment;

          if (seg.Visible) or (cov.EP_Mandatory) then begin

            //insert the earned premium record...
            Q1.SQL.Clear;
            Q1.SQL.Add('insert into [' + PLTempTable + '] (');
            Q1.SQL.Add(' EP_RecordID, EP_Premium_Date, EP_Days_Earned, EP_PolicyCode, EP_Line_Num, EP_Prem_Name, EP_TransactionType, ');
            Q1.SQL.Add(' EP_Inception_Date, EP_Effective_Date, EP_Entry_Date, EP_Accounting_Date, EP_AnnualPremium, EP_AnnualFees, ');
            Q1.SQL.Add(' EP_Written_Premium, EP_Written_Fees, EP_Earned_Premium, EP_Earned_Fees, EP_Unearned_Premium, EP_Unearned_Fees, EP_RoundAdj');
            Q1.SQL.Add(') values (');
            Q1.SQL.Add(' :POLID, :PREMDATE, :DAYSERN, :POLCODE, :LINENUM, :PREMNAME, :TRNTYPE, :INCDATE, :EFFDATE, :ENTDATE, :ACCDATE,');
            Q1.SQL.Add(' :ANNPREM, :ANNFEE, :WP, :WPFEE, :EP, :EPFEE, :UP, :UPFEE, :EPADJ');
            Q1.SQL.Add(')');

            Q1.ParamByName('POLID').AsInteger := trn.PolicyID;
            Q1.ParamByName('POLCODE').AsString := params.PolicyCode;
            Q1.ParamByName('TRNTYPE').AsString := transTypeToString(trn.TrnType);
            Q1.ParamByName('LINENUM').AsInteger := trn.Line_Num;
            Q1.ParamByName('DAYSERN').AsInteger := seg.Days_Earned;
            Q1.ParamByName('PREMNAME').AsString := cov.Name;
            Q1.ParamByName('PREMDATE').AsSQLTimeStamp := DateTimeToSQLTimeStamp(StrToDateTime(FormatDateTime('MM/DD/YYYY', PremiumDate)));
            Q1.ParamByName('INCDATE').AsString := DateTimeToStr(trn.Inception_Date);
            Q1.ParamByName('EFFDATE').AsString := DateTimeToStr(trn.Effective_Date);
            Q1.ParamByName('ENTDATE').AsString := DateTimeToStr(trn.Entry_Date);
            Q1.ParamByName('ACCDATE').AsString := DateTimeToStr(trn.Accounting_Date);
            Q1.ParamByName('ANNPREM').AsCurrency := trn.BasePremium;
            Q1.ParamByName('ANNFEE').AsCurrency := trn.Fees;
            Q1.ParamByName('WP').AsCurrency := seg.Written_Premium;
            Q1.ParamByName('WPFEE').AsCurrency := seg.Written_Fees;
            Q1.ParamByName('EP').AsCurrency := seg.Earned_Premium;
            Q1.ParamByName('EPFEE').AsCurrency := seg.Earned_Fees;
            Q1.ParamByName('EPADJ').AsCurrency := seg.Earned_RoundAdj;
            Q1.ParamByName('UP').AsCurrency := seg.Unearned_Premium;
            Q1.ParamByName('UPFEE').AsCurrency := seg.Unearned_Fees;

            Premium.Debug('Query InsertEP:', Q1.SQL.Text, 'InsertEP');
            Premium.Debug('Query InsertEP:', serializeQueryParams(Q1));

            Q1.ExecSQL;
          end;
        end; //for j
      end; //if cov.CalcRuleName = '' then begin
    end; // for i

    //now post the data from temp table into the EP table
    Q1.SQL.Clear;
    Q1.SQL.Add('insert into [' + Premium.Coverages[0].EPTableName + '] ');
    Q1.SQL.Add('(EP_RecordID, EP_Premium_Date, EP_Days_Earned, EP_PolicyCode, EP_Line_Num, EP_Prem_Name, ');
    Q1.SQL.Add('EP_TransactionType, EP_Inception_Date, EP_Effective_Date, EP_Entry_Date, EP_Accounting_Date, ');
    Q1.SQL.Add('EP_AnnualPremium, EP_AnnualFees, EP_Written_Premium, EP_Written_Fees, EP_Earned_Premium, ');
    Q1.SQL.Add('EP_Earned_Fees, EP_Unearned_Premium, EP_Unearned_Fees, EP_RoundAdj) ');
    Q1.SQL.Add('select A.EP_RecordID, A.EP_Premium_Date, A.EP_Days_Earned, A.EP_PolicyCode, A.EP_Line_Num, A.EP_Prem_Name, ');
    Q1.SQL.Add('A.EP_TransactionType, A.EP_Inception_Date, A.EP_Effective_Date, A.EP_Entry_Date, A.EP_Accounting_Date, ');
    Q1.SQL.Add('A.EP_AnnualPremium, A.EP_AnnualFees, A.EP_Written_Premium, A.EP_Written_Fees, A.EP_Earned_Premium, ');
    Q1.SQL.Add('A.EP_Earned_Fees, A.EP_Unearned_Premium, A.EP_Unearned_Fees, A.EP_RoundAdj ');
    Q1.SQL.Add('from [' + PLTempTable + '] as A with(nolock) ');
    Q1.ExecSQL;

    Result := True;
  finally
    Premium.DropTempTable(PLTempTable);
    Premium.Debug('END of UpdateWrittenPremiumEx.');

    Premium.Free;
    Q1.Free;
  end;
end; //UpdateEarnedPremium   

function EarnedPremiumByDate(const LineOB: integer; const PolicyCode: string; const calcDate: TDateTime; const SQLConnection: TSQLConnection; var FReqList: TStringList): boolean;
var
  pp: TPremium_Params;
begin
  pp := getBlankPremiumParams;

  pp.LOBID := LineOB;
  pp.PolicyCode := PolicyCode;

  result := EarnedPremiumByDateEx(pp, calcDate, SQLConnection, FReqList);
end;

function EarnedPremiumByDateEx(const params: TPremium_Params; const calcDate: TDateTime; const SQLConnection: TSQLConnection; var FReqList: TStringList): boolean;
var
  Premium: TMax_Premium;
  segment: TSegment;
begin
  //load this policy earned premium result...
  Premium := TMax_Premium.Create(params);
  try
    Premium.SQLConnection := SQLConnection;

    result := Premium.GetEarnedPremiumByPolicyCode(calcDate, 0);
    if not result then
      Exit;

    segment := Premium.GetAllCoverageTotals(calcDate);
  finally
    Premium.Free;
  end;

  //save the result to the reqlist...
  FReqList.Values['Written_Fees'] := currToStr(segment.Written_Fees);
  FReqList.Values['Written_Premium'] := currToStr(segment.Written_Premium);
  FReqList.Values['Written_Factor'] := floatToStr(segment.Written_Factor);
  FReqList.Values['ProRate_Factor'] := floatToStr(segment.ProRate_Factor);
  FReqList.Values['Written_RoundingAdj'] := floatToStr(segment.Written_RoundAdj);
  FReqList.Values['Earned_Fees'] := currToStr(segment.Earned_Fees);
  FReqList.Values['Earned_Premium'] := currToStr(segment.Earned_Premium);
  FReqList.Values['Earned_RoundingAdj'] := currToStr(segment.Earned_RoundAdj);
  FReqList.Values['Unearned_Fees'] := currToStr(segment.Unearned_Fees);
  FReqList.Values['Unearned_Premium'] := currToStr(segment.Unearned_Premium);
  FReqList.Values['Days_Earned'] := IntToStr(segment.Days_Earned);
  FReqList.Values['Daily_Earned'] := floatToStr(segment.Daily_Earned);

  Result := True;
end; //end function EarnedPremiumByDate

function GetWrittenPremiumRec(const LOBID: integer; const PolicyCode: string; const SQLConnection: TSQLConnection; const GetRecordID: integer; const AddRecordID: integer; var FReqList: TStringList): boolean;
var
  pp: TPremium_Params;
begin
  pp := getBlankPremiumParams;

  pp.LOBID := LOBID;
  pp.PolicyCode := PolicyCode;

  result := GetWrittenPremiumRecEx(pp, SQLConnection, GetRecordID, AddRecordID, FReqList);
end;

function GetWrittenPremiumRecEx(const params: TPremium_Params; const SQLConnection: TSQLConnection; const GetRecordID: integer; const AddRecordID: integer; var fReqList: TStringList): boolean;
var
  Premium: TMax_Premium;
  Coverages: TCoverages;
  i, j, WrPremID: Integer;
  totals, seg: TSegment;
begin
  Result := False;

  //load this policy written premium array result (PremArray)...
  Premium := TMax_Premium.Create(params);
  try
    Premium.SQLConnection := SQLConnection;

    Premium.Debug('START of GetWrittenPremiumRecEx...');

    Coverages := Premium.GetCoverages(AddRecordID);
    if Length(Coverages) = 0 then
      Exit;

    totals := getBlankSegment;
    for i := low(Coverages) to high(Coverages) do begin
      for j := low(Coverages[i].Transactions) to high(Coverages[i].Transactions) do begin
        if Coverages[i].Transactions[j].PolicyID = GetRecordID then begin
          seg := Coverages[i].Transactions[j].Segment;

          totals.Written_Fees := totals.Written_Fees + seg.Written_Fees;
          totals.Written_Premium := totals.Written_Premium + seg.Written_Premium;
          totals.Written_RoundAdj := totals.Written_RoundAdj + seg.Written_RoundAdj;
          totals.Daily_Earned := totals.Daily_Earned + seg.Daily_Earned;
          totals.Short_Rate := totals.Short_Rate + seg.Short_Rate; //19079

          //LK: This returns last values only!
          totals.Written_Factor := seg.Written_Factor;
          totals.ProRate_Factor := seg.ProRate_Factor;

          break;
        end;
      end;
    end;

    // Save the result to reqlist
    fReqList.Values['Written_Fees'] := currToStr(totals.Written_Fees);
    fReqList.Values['Written_Premium'] := currToStr(totals.Written_Premium);
    fReqList.Values['Written_RoundingAdj'] := floatToStr(totals.Written_RoundAdj);
    fReqList.Values['Written_Factor'] := floatToStr(totals.Written_Factor);
    fReqList.Values['ProRate_Factor'] := floatToStr(totals.ProRate_Factor);
    fReqList.Values['Daily_Earned'] := floatToStr(totals.Daily_Earned);
    fReqList.Values['Written_Premium_ShorRate'] := currToStr(totals.Short_Rate);

    Premium.Debug('Calculated Totals:', serializeSegment(totals));

    result := True;
  finally
    Premium.Debug('END of GetWrittenPremiumRecEx.');
    Premium.Free;
  end;
end;

function UpdateWrittenPremiumLevel(const FrmID: integer; const PolicyCode: string; const SQLConnection: TSQLConnection): boolean;
var
  pp: TPremium_Params;
begin
  pp := getBlankPremiumParams;

  pp.FRMID := FrmID;
  pp.PolicyCode := PolicyCode;

  result := UpdateWrittenPremiumLevelEx(pp, SQLConnection);
end;

function UpdateEarnedPremiumLevel(const FrmID: integer; const PolicyCode: string; const calcDate: TDateTime; const SQLConnection: TSQLConnection): boolean;
var
  pp: TPremium_Params;
begin
  pp := getBlankPremiumParams;

  pp.FRMID := FrmID;
  pp.PolicyCode := PolicyCode;

  result := UpdateEarnedPremiumLevelEx(pp, calcDate, SQLConnection);
end;

function UpdateWrittenPremiumLevelEx(const params: TPremium_Params; const SQLConnection: TSQLConnection): boolean;
var
  Premium: TMax_Premium;
  totals: TSegment;
begin
  Premium := TMax_Premium.Create(params);
  try
    Premium.SQLConnection := SQLConnection;

    // Get results with updating the DB!
    result := Premium.UpdatePremiumByLevel(totals, 0, 0, 0, true);
  finally
    Premium.Free;
  end;
end;

function UpdateEarnedPremiumLevelEx(const params: TPremium_Params; const calcDate: TDateTime; const SQLConnection: TSQLConnection): boolean;
var
  Premium: TMax_Premium;
begin
  Premium := TMax_Premium.Create(params);
  try
    Premium.SQLConnection := SQLConnection;

    Result := Premium.UpdateEarnedPremiumByLevel(calcDate, 0);
  finally
    Premium.Free;
  end;
end;

function EarnedPremiumLevelByDateEx(const params: TPremium_Params; const calcDate: TDateTime; const SQLConnection: TSQLConnection; var FReqList: TStringList): boolean;
var
  Premium: TMax_Premium;
  totals: TSegment;
begin
  Premium := TMax_Premium.Create(params);
  try
    Premium.SQLConnection := SQLConnection;

    // Get results without updating the DB!
    result := Premium.UpdatePremiumByLevel(totals, 0, 0, calcDate, false);
    if not result then
      Exit;
  finally
    Premium.Free;
  end;

  //save the result to the reqlist...
  FReqList.Values['Written_Fees'] := currToStr(totals.Written_Fees);
  FReqList.Values['Written_Premium'] := currToStr(totals.Written_Premium);
  FReqList.Values['Written_Factor'] := floatToStr(totals.Written_Factor);
  FReqList.Values['ProRate_Factor'] := floatToStr(totals.ProRate_Factor);
  FReqList.Values['Written_RoundingAdj'] := floatToStr(totals.Written_RoundAdj);
  FReqList.Values['Earned_Fees'] := currToStr(totals.Earned_Fees);
  FReqList.Values['Earned_Premium'] := currToStr(totals.Earned_Premium);
  FReqList.Values['Earned_RoundingAdj'] := currToStr(totals.Earned_RoundAdj);
  FReqList.Values['Unearned_Fees'] := currToStr(totals.Unearned_Fees);
  FReqList.Values['Unearned_Premium'] := currToStr(totals.Unearned_Premium);
  FReqList.Values['Written_Premium_ShorRate'] := currToStr(totals.Short_Rate);
  FReqList.Values['Days_Earned'] := IntToStr(totals.Days_Earned);
  FReqList.Values['Daily_Earned'] := floatToStr(totals.Daily_Earned);
end;

function GetWrittenPremiumLevelRecEx(const params: TPremium_Params; const SQLConnection: TSQLConnection; const GetRecordID: integer; const AddRecordID: integer; var FReqList: TStringList): boolean;
var
  Premium: TMax_Premium;
  totals: TSegment;
begin
  Premium := TMax_Premium.Create(params);
  try
    Premium.SQLConnection := SQLConnection;

    // Get results without updating the DB!
    result := Premium.UpdatePremiumByLevel(totals, GetRecordID, AddRecordID, 0, false);
    if not result then
      Exit;
  finally
    Premium.Free;
  end;

  //save the result back to RL
  FReqList.Values['Written_Fees'] := currToStr(totals.Written_Fees);
  FReqList.Values['Written_Premium'] := currToStr(totals.Written_Premium);
  FReqList.Values['Written_RoundingAdj'] := floatToStr(totals.Written_RoundAdj);
  FReqList.Values['Written_Factor'] := floatToStr(totals.Written_Factor);
  FReqList.Values['ProRate_Factor'] := floatToStr(totals.ProRate_Factor);
  FReqList.Values['Daily_Earned'] := floatToStr(totals.Daily_Earned);
  FReqList.Values['Written_Premium_ShorRate'] := currToStr(totals.Short_Rate);
end;

function GetPaidToDate(const LOBID: integer; const PolicyCode, TransType: string; const AccTotalAmount, BalanceAmount: double; const IncDate, EffDate, ExpDate: TdateTime; const AddRecordID: integer; const SQLConnection: TSQLConnection): TDateTime;
var
  pp: TPremium_Params;
begin
  pp := getBlankPremiumParams;

  pp.LOBID := LOBID;
  pp.PolicyCode := PolicyCode;

  result := GetPaidToDateEx(pp, TransType, AccTotalAmount, BalanceAmount, IncDate, EffDate, ExpDate, AddRecordID, SQLConnection);
end;

function GetPaidToDateEx(const params: TPremium_Params; const TransType: string; const AccTotalAmount, BalanceAmount: double; const IncDate, EffDate, ExpDate: TdateTime; const AddRecordID: integer; const SQLConnection: TSQLConnection): TDateTime;
var
  Premium: TMax_Premium;
  segment: TSegment;
  PaidDate: TDateTime;
  Canceled_DailyEarned: Currency;
  AmtLeft, Daily, PrevDaily, Earned, DailyTotal: Double;
  TrnType: TTransactionType;
  i, y, DE: Integer;
  MoveByXDays, TotalMoveByXDays: double;
begin

  //load the WP and EP arrays as of end of time...
  Premium := TMax_Premium.Create(params);
  try
    Premium.SQLConnection := SQLConnection;

    if not Premium.GetEarnedPremiumByPolicyCode(ExpDate, AddRecordID) then
      exit;

    segment := Premium.GetAllCoverageTotals(ExpDate);

    //the calculation logic overwritten due to WP changes for the earned days #23071
    //if no transactions recorded then set the result to inception...
    if (AccTotalAmount = 0) then begin
      Result := IncDate;
      exit;
    end;

    //if current transaction is cancellation
    if (TransType = 'CN') or (TransType = 'CR') then begin
      if EffDate - IncDate = 0 then
        //if flat cancel...
        Canceled_DailyEarned := 0
      else
        Canceled_DailyEarned := (segment.Written_Premium / (EffDate - IncDate));
      if Canceled_DailyEarned > 0 then
        PaidDate := StrToDateTime(FormatDateTime('MM/DD/YYYY', Round(IncDate + Round((AccTotalAmount - segment.Earned_Fees) / Canceled_DailyEarned))))
      else
        PaidDate := IncDate; //flat cancel
      if (PaidDate < IncDate) then PaidDate := IncDate;
      Result := PaidDate;
      exit;
    end;

    //if no ballance (or negative) - all was earned...
    //no exit if the policy was forward dated...#23732
    if (BalanceAmount <= 0) and (IncDate <= now) then begin
      PaidDate := StrToDateTime( FormatDateTime( 'MM/DD/YYYY', Round( ExpDate ) ) );
      Result := PaidDate;
      exit;
    end;

    //calculate using the premium records...
    AmtLeft := (AccTotalAmount - segment.Earned_Fees); //begin - substract any WP fees
    PaidDate := StrToDateTime(FormatDateTime('MM/DD/YYYY', Round(IncDate))); //begin - set the result to inception

    (* #61485 - MJ - noticed invalid order (EN-NB-RI-CN) when sorted by same eff date!!! We do not need to sort - transactions loaded by trans order (and if trans order is wrong, need to be fixed !!!)
    //sort transaction for all premums bt effective date...
    for y := Low(Premium.Coverages) to High(Premium.Coverages) do begin
      //sort the prem transaction array by eff date...
      QuickSort(Premium.Coverages[y].Transactions, Low(Premium.Coverages[y].Transactions), High(Premium.Coverages[y].Transactions));
    end;
    *)

    DailyTotal := 0;
    Daily:= 0;
    PrevDaily:= 0;
    TotalMoveByXDays := 0;

    //loop for all premium transaction type records (ex. NB, EN, CN...)
    for I := Low(Premium.Coverages[0].Transactions) to high(Premium.Coverages[0].Transactions) do begin
      TrnType := Premium.Coverages[0].Transactions[i].TrnType; //we dont really usinf this variable - added only for debugging...
      Earned := 0;
      PrevDaily:= Daily;
      Daily := 0;
      MoveByXDays := 0;

      //loop for all premium type records by this premium transaction type (ex. BI, PD, UMBI...) and get Earned amount and daily earned...
      for y := Low(Premium.Coverages) to High(Premium.Coverages) do begin
        Earned := Earned + Premium.Coverages[y].Transactions[i].Segment.Earned_Premium; //add all EP
        Daily := Daily + Premium.Coverages[y].Transactions[i].Segment.Daily_Earned; //add all daily earned
      end;

      //get number of days earned of the transaction...
      if (i = high(Premium.Coverages[0].Transactions)) then
        DE := Premium.Coverages[0].Transactions[i].Segment.Days_Earned
      else
        DE := Premium.Coverages[0].Transactions[i].Segment.Days_Earned - Premium.Coverages[0].Transactions[i + 1].Segment.Days_Earned;

      //adjust the daily earned total for daily earned of this trn...
      DailyTotal := DailyTotal + Daily;

      //Fix for non monetary EN #64855 (the real daily is 0 for NM EN, so we dont add to the dailytotal, but keep the last trn daily for the next condittion)
      if Daily = 0 then begin
        Daily:= PrevDaily;
        PrevDaily:= 0;
      end;

      //if this trn earn days then calculate...
      if DE > 0 then begin
        //if DailyTotal > 0 then begin //use the number of days earned...
          //get the days to add to the PaidToDate...
        if (AmtLeft - (DE * DailyTotal)) > DailyTotal then //#61485 - NEED TO CODE REVIEW
          MoveByXDays := DE
        else if DailyTotal <> 0 then
          MoveByXDays := (AmtLeft / DailyTotal)
        else
          MoveByXDays:= 0;

        AmtLeft := AmtLeft - (MoveByXDays * DailyTotal); //substract the used amount...

        TotalMoveByXDays := TotalMoveByXDays + MoveByXDays;
      end;

    end; //for I := Low( Premium.Coverages[0].Transactions ) to high( Premium.Coverages[0].Transactions ) do begin

    //Make sure that the date is not less inception date...
    PaidDate := PaidDate + trunc(TotalMoveByXDays);
    if PaidDate < IncDate then
      PaidDate := IncDate;

    Result := PaidDate;
  finally
    Premium.Free;
  end;
end;

function TMax_Premium.AddCoverage(coverage: TCoverage): integer;
var
  cnt: integer;
begin
  cnt := Length(fCoverages);
  SetLength(fCoverages, cnt + 1);
  fCoverages[cnt] := coverage;

  Self.Debug('Added Coverage ' + IntToStr(cnt) + ':', serializeCoverage(coverage));

  result := cnt;
end;

function TMax_Premium.GetCoverage(index: integer): TCoverage;
begin
  result := fCoverages[index];
end;

function TMax_Premium.AddTransaction(covIdx: integer; var transaction: TTransaction): integer;
var
  cnt: integer;
begin
  cnt := Length(fCoverages[covIdx].Transactions);
  transaction.Line_Num := cnt + 1;
  SetLength(fCoverages[covIdx].Transactions, cnt + 1);
  fCoverages[covIdx].Transactions[cnt] := transaction;

  Self.Debug('Added Transaction ' + IntToStr(cnt) + ':', serializeTransaction(transaction));

  result := cnt;
end;

function TMax_Premium.StringToTransactionType(const InputString: string): TTransactionType;
begin
  result := strToTransType(InputString);
end;

procedure TMax_Premium.Clear;
var
  i: integer;
begin
  for i := Low(fCoverages) to High(fCoverages) do
    SetLength(fCoverages[i].Transactions, 0);

  SetLength(fCoverages, 0);  
end;

end.




// Old / Not used code
procedure TMax_Premium.SaveWrittPremLevelData(const line: TLine; Q1: TSQLQuery);
begin
  if LevelPremium_Line.WPL_ID > 0 then begin //record exist - update...
    Q1.SQL.Clear;
    Q1.SQL.Add('update [' + LevelPremium_Line.WPL_TableName + '] set ');
    Q1.SQL.Add('WPL_RecordID = :POLID, ');
    Q1.SQL.Add('WPL_PolicyCode = :POL, ');
    Q1.SQL.Add('WPL_FrmID = :FRMID, ');
    Q1.SQL.Add('WP_ID = :WPID, ');
    Q1.SQL.Add('WPL_Line_Num = :LNUM, ');
    Q1.SQL.Add('WPL_Level_Name = :LNME, ');
    Q1.SQL.Add('WPL_TransactionType = :TRN, ');
    Q1.SQL.Add('WPL_Level = :LVL, ');
    Q1.SQL.Add('sPRL_ID = :SPRLID, ');
    Q1.SQL.Add('WPL_PremSourceID = :PRSID, ');
    Q1.SQL.Add('WPL_AnnualPremium = :ANLPRM, ');
    Q1.SQL.Add('WPL_AnnualFees = :ANLFEE, ');
    Q1.SQL.Add('WPL_Written_Premium = :WP, ');
    Q1.SQL.Add('WPL_Written_Fees = :FEE, ');
    Q1.SQL.Add('WPL_RoundingAdj = :RADJ, ');
    Q1.SQL.Add('WPL_Deleted = :DLT, ');
    Q1.SQL.Add('WPL_UniqueID = :UID, ');
    Q1.SQL.Add('WPL_Written_Premium_SR = :WPSR ');
    Q1.SQL.Add('where WPL_ID = :IND ');

    Q1.ParamByName('IND').AsString := IntToStr(LevelPremium_Line.WPL_ID);
  end else begin //record does not exist - insert...
    if not (LevelPremium_Line.WPL_Mandatory) //#24728
      and (LevelPremium_Line.AnnualPremium = 0)
      and (LevelPremium_Line.Written_Premium = 0)
      and (LevelPremium_Line.AnnualFees = 0)
      and (LevelPremium_Line.Written_Fees = 0) then exit;

    Q1.SQL.Clear;
    Q1.SQL.Add('insert into [' + LevelPremium_Line.WPL_TableName + '] ');
    Q1.SQL.Add('(WPL_RecordID, WPL_PolicyCode, WPL_FrmID, WP_ID, WPL_Line_Num, WPL_Level_Name, WPL_TransactionType, ');
    Q1.SQL.Add('WPL_Level, sPRL_ID, WPL_PremSourceID, WPL_AnnualPremium, ');
    Q1.SQL.Add('WPL_AnnualFees, WPL_Written_Premium, WPL_Written_Fees, WPL_RoundingAdj, WPL_Deleted, WPL_UniqueID, WPL_Written_Premium_SR) ');
    Q1.SQL.Add('values(:POLID, :POL, :FRMID, :WPID, :LNUM, :LNME, :TRN, :LVL,  :SPRLID, :PRSID,');
    Q1.SQL.Add(':ANLPRM, :ANLFEE, :WP, :FEE, :RADJ, :DLT, :UID, :WPSR) ');
  end;

  Q1.ParamByName('POLID').AsInteger := LevelPremium_Line.PolID;
  Q1.ParamByName('POL').AsString := LevelPremium_Line.PolicyCode;
  Q1.ParamByName('FRMID').AsInteger := LevelPremium_Line.FrmID;
  Q1.ParamByName('WPID').AsInteger := LevelPremium_Line.WrtPremID;
  Q1.ParamByName('LNUM').AsInteger := LevelPremium_Line.Line_Num;
  Q1.ParamByName('LNME').AsString := LevelPremium_Line.Level_Name;
  Q1.ParamByName('TRN').AsString := LevelPremium_Line.TrnType;
  Q1.ParamByName('LVL').AsInteger := LevelPremium_Line.Level;
  Q1.ParamByName('SPRLID').AsInteger := LevelPremium_Line.PRL_ID;
  Q1.ParamByName('PRSID').AsInteger := LevelPremium_Line.PremSourceID;
  Q1.ParamByName('ANLPRM').AsCurrency := LevelPremium_Line.AnnualPremium;
  Q1.ParamByName('ANLFEE').AsCurrency := LevelPremium_Line.AnnualFees;
  Q1.ParamByName('WP').AsCurrency := LevelPremium_Line.Written_Premium;
  Q1.ParamByName('FEE').AsCurrency := LevelPremium_Line.Written_Fees;
  Q1.ParamByName('RADJ').AsFloat := LevelPremium_Line.Written_RoundAdj;
  Q1.ParamByName('DLT').AsBoolean := LevelPremium_Line.DeletedSR;
  Q1.ParamByName('UID').AsString := LevelPremium_Line.LevelRecID;
  Q1.ParamByName('WPSR').AsCurrency := LevelPremium_Line.Short_Rate;

  Self.Debug('Query SaveWPLevelData [' + LevelPremium_Line.WPL_TableName + ']:', Q1.SQL.Text, 'SaveWPLevelData');
  Self.Debug('Query SaveWPLevelData [' + LevelPremium_Line.WPL_TableName + ']:', serializeQueryParams(Q1));

  Q1.ExecSQL;
end;

//**********************************************************************************

procedure TMax_Premium.SaveEarnedPremLevelData(const line: TLine; const PremiumDate: TDateTime; Q1: TSQLQuery);
begin
  if (LevelPremium_Line.EPL_ID > 0) and not (LevelPremium_Line.Visible) and not (LevelPremium_Line.EPL_Mandatory) then begin //record exist but it should be not visible - delete it...
    Q1.SQL.Clear;
    Q1.SQL.Add('delete from [' + LevelPremium_Line.EPL_TableName + '] ');
    Q1.SQL.Add('where EPL_ID = :IND ');
    Q1.ParamByName('IND').AsString := IntToStr(LevelPremium_Line.EPL_ID);
    Q1.ExecSQL;
  end;
  if not (LevelPremium_Line.Visible) and not (LevelPremium_Line.EPL_Mandatory) then
    exit;
  if LevelPremium_Line.EPL_ID > 0 then begin //record exist - update...
    Q1.SQL.Clear;
    Q1.SQL.Add('update [' + LevelPremium_Line.EPL_TableName + '] set ');
    Q1.SQL.Add('EPL_RecordID = :POLID, ');
    Q1.SQL.Add('EPL_Premium_Date = :PRDTE, ');
    Q1.SQL.Add('EPL_PolicyCode = :POL, ');
    Q1.SQL.Add('EPL_FrmID = :FRMID, ');
    Q1.SQL.Add('WP_ID = :WPID, ');
    Q1.SQL.Add('EPL_Line_Num = :LNUM, ');
    Q1.SQL.Add('EPL_Level_Name = :LNME, ');
    Q1.SQL.Add('EPL_TransactionType = :TRN, ');
    Q1.SQL.Add('EPL_Level = :LVL, ');
    Q1.SQL.Add('sPRL_ID = :SPRLID, ');
    Q1.SQL.Add('EPL_PremSourceID = :PRSID, ');
    Q1.SQL.Add('EPL_AnnualPremium = :ANLPRM, ');
    Q1.SQL.Add('EPL_AnnualFees = :ANLFEE, ');
    Q1.SQL.Add('EPL_Days_Earned = :DERN, ');
    Q1.SQL.Add('EPL_Written_Premium = :WP, ');
    Q1.SQL.Add('EPL_Written_Fees = :FEE, ');
    Q1.SQL.Add('EPL_Earned_Premium = :EP, ');
    Q1.SQL.Add('EPL_Earned_Fees = :EFEE, ');
    Q1.SQL.Add('EPL_Unearned_Premium = :UEP, ');
    Q1.SQL.Add('EPL_Unearned_Fees = :UEFEE, ');
    Q1.SQL.Add('EPL_Deleted = :DLT, ');
    Q1.SQL.Add('EPL_UniqueID = :UID, ');
    Q1.SQL.Add('EPL_RoundAdj = :RNDADJ ');
    Q1.SQL.Add('where EPL_ID = :IND ');

    Q1.ParamByName('IND').AsString := IntToStr( LevelPremium_Line.EPL_ID);
  end else begin //record does not exist - insert...
    {
    !!! this condition changing due to new requirement to not post trn. if not visible (acc date greater than pol. exp.) #36898
    if not(LevelPremium_Line.EPL_Mandatory) //#24728
    and (LevelPremium_Line.AnnualPremium = 0)
    and (LevelPremium_Line.Written_Premium = 0)
    and (LevelPremium_Line.AnnualFees = 0)
    and (LevelPremium_Line.Written_Fees = 0) then exit;
    }
    Q1.SQL.Clear;
    Q1.SQL.Add('insert into [' + LevelPremium_Line.EPL_TableName + '] ');
    Q1.SQL.Add('(EPL_RecordID, EPL_Premium_Date, EPL_PolicyCode, EPL_FrmID, WP_ID, EPL_Line_Num, EPL_Level_Name, EPL_TransactionType, ');
    Q1.SQL.Add('EPL_Level, sPRL_ID, EPL_PremSourceID, EPL_AnnualPremium, ');
    Q1.SQL.Add('EPL_AnnualFees, EPL_Days_Earned, EPL_Written_Premium, EPL_Written_Fees, ');
    Q1.SQL.Add('EPL_Earned_Premium, EPL_Earned_Fees, EPL_Unearned_Premium, EPL_Unearned_Fees, EPL_Deleted, EPL_UniqueID, EPL_RoundAdj) ');
    Q1.SQL.Add('values(:POLID, :PRDTE, :POL, :FRMID, :WPID, :LNUM, :LNME, :TRN, :LVL,  :SPRLID, :PRSID,');
    Q1.SQL.Add(':ANLPRM, :ANLFEE, :DERN, :WP, :FEE, :EP, :EFEE, :UEP, :UEFEE, :DLT, :UID, :RNDADJ) ');
  end;

  Q1.ParamByName('POLID').AsInteger := LevelPremium_Line.PolID;
  Q1.ParamByName('PRDTE').AsString := FormatDateTime('MM/DD/YYYY', PremiumDate);
  Q1.ParamByName('POL').AsString := LevelPremium_Line.PolicyCode;
  Q1.ParamByName('FRMID').AsInteger := LevelPremium_Line.FrmID;
  Q1.ParamByName('WPID').AsInteger := LevelPremium_Line.WrtPremID;
  Q1.ParamByName('LNUM').AsInteger := LevelPremium_Line.Line_Num;
  Q1.ParamByName('LNME').AsString := LevelPremium_Line.Level_Name;
  Q1.ParamByName('TRN').AsString := LevelPremium_Line.TrnType;
  Q1.ParamByName('LVL').AsInteger := LevelPremium_Line.Level;
  Q1.ParamByName('SPRLID').AsInteger := LevelPremium_Line.PRL_ID;
  Q1.ParamByName('PRSID').AsInteger := LevelPremium_Line.PremSourceID;
  Q1.ParamByName('ANLPRM').AsCurrency := LevelPremium_Line.AnnualPremium;
  Q1.ParamByName('ANLFEE').AsCurrency := LevelPremium_Line.AnnualFees;
  Q1.ParamByName('DERN').AsInteger := LevelPremium_Line.Days_Earned;
  Q1.ParamByName('WP').AsCurrency := LevelPremium_Line.Written_Premium;
  Q1.ParamByName('FEE').AsCurrency := LevelPremium_Line.Written_Fees;
  Q1.ParamByName('EP').AsCurrency := LevelPremium_Line.Earned_Premium;
  Q1.ParamByName('EFEE').AsCurrency := LevelPremium_Line.Earned_Fees;
  Q1.ParamByName('UEP').AsCurrency := LevelPremium_Line.Unearned_Premium;
  Q1.ParamByName('UEFEE').AsCurrency := LevelPremium_Line.Unearned_Fees;
  Q1.ParamByName('DLT').AsBoolean := LevelPremium_Line.DeletedSR;
  Q1.ParamByName('UID').AsString := LevelPremium_Line.LevelRecID;
  Q1.ParamByName('RNDADJ').AsCurrency := LevelPremium_Line.Earned_RoundAdj;

  Self.Debug('Query SaveEPLevelData [' + LevelPremium_Line.WPL_TableName + ']:', Q1.SQL.Text, 'SaveEPLevelData');
  Self.Debug('Query SaveEPLevelData [' + LevelPremium_Line.WPL_TableName + ']:', serializeQueryParams(Q1));

  Q1.ExecSQL;
end;


//Changed on 5/13/19
  // Copy the segment data back into the risk/level...
  t := 0;
  totals := getBlankSegment;
  for i := Low(Lines) to High(Lines) do begin
    if Lines[i].LevelIndex = LevelIndex then begin
      Lines[i].Segment := cov.Transactions[t].Segment;

      if wpOnly then begin
        if (updateDB) and ((Lines[i].Accounting_Date <= fParams.PremiumDate) or (Lines[i].WPL_Mandatory)) then
          SaveWrittPremLevelTemp(Lines[i], PLTempTable, level.WPL_TableName);

        doSumarize := ((Lines[i].Segment.Visible) and (Lines[i].Accounting_Date <= fParams.PremiumDate)) or (Lines[i].WPL_Mandatory);
      end else begin
        if (updateDB) then
          SaveEarnedPremLevelTemp(Lines[i], PLTempTable, level.EPL_TableName);

        doSumarize := (Lines[i].Segment.Visible) or (Lines[i].EPL_Mandatory);
      end;

      //35531 - get EP and WP totals by level
      if (doSumarize) and ((Lines[i].PolID = RecID) or (RecID = 0)) then begin
        totals.Written_Fees := totals.Written_Fees + Lines[i].Segment.Written_Fees;
        totals.Written_Premium := totals.Written_Premium + Lines[i].Segment.Written_Premium;
        totals.Earned_Fees := totals.Earned_Fees + Lines[i].Segment.Earned_Fees;
        totals.Earned_Premium := totals.Earned_Premium + Lines[i].Segment.Earned_Premium;
        totals.Unearned_Fees := totals.Unearned_Fees + Lines[i].Segment.Unearned_Fees;
        totals.Unearned_Premium := totals.Unearned_Premium + Lines[i].Segment.Unearned_Premium;
        totals.Written_RoundAdj := totals.Written_RoundAdj + Lines[i].Segment.Written_RoundAdj;
        totals.Earned_RoundAdj := totals.Earned_RoundAdj + Lines[i].Segment.Earned_RoundAdj;
        totals.Short_Rate := totals.Short_Rate + Lines[i].Segment.Short_Rate;
      end;

      Inc(t);
    end;
  end;

