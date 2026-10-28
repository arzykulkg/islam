// Çetele → Google Tablo köprüsü (script.new ile kendi Google hesabınızda yeni proje açıp yapıştırın)
var SHEET_ID = '142Mc1NIe8KWNmc6RLK1RHiyUHW3eyMYKsgkan_1d49Q'; // Kaçakçılar tablosu
var GID      = 870788497;                                       // bağlantıdaki sekme
var PERSON   = 'Name 3';                                        // tablodaki sizin bloğunuz
var KEY      = 'BURAYA-KENDI-GIZLI-KELIMENIZI-YAZIN';           // sitedeki "Gizli anahtar" ile aynı olmalı

function out_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function norm_(s){return String(s).toLowerCase().replace(/\(week\)/g,'').replace(/\s+/g,' ').trim()}
function dm_(v){ // 26.10 biçimi
  if(v instanceof Date) return v.getDate()+'.'+(v.getMonth()+1);
  return String(v).trim().replace(/\b0+(\d)/g,'$1');
}
function doGet(e){return out_({ok:true,ping:true,keyOk:(e.parameter.key===KEY)})}
function doPost(e){
  try{
    var p=JSON.parse(e.postData.contents);
    if(p.key!==KEY) return out_({ok:false,error:'bad-key'});
    var ss=SpreadsheetApp.openById(SHEET_ID),sh=null;
    if(p.sheet) sh=ss.getSheetByName(p.sheet);
    if(!sh) ss.getSheets().forEach(function(s){if(s.getSheetId()===GID) sh=s});
    if(!sh) return out_({ok:false,error:'no-sheet'});
    var data=sh.getDataRange().getValues(), person=p.person||PERSON, r0=-1;
    for(var i=0;i<data.length;i++){ if(String(data[i][1]).trim()===person){r0=i;break} }
    if(r0<0) return out_({ok:false,error:'no-person',sheet:sh.getName()});
    var row=-1;
    for(var j=r0+1;j<=r0+8&&j<data.length;j++){
      if(Number(data[j][2])===Number(p.weekday)){row=j;break}
      if(String(data[j][1]).trim()==='TOPLAM') break;
    }
    if(row<0) return out_({ok:false,error:'no-day',sheet:sh.getName()});
    var rowDate=data[row][1];
    if(rowDate!=='' && typeof rowDate!=='number' && dm_(rowDate)!==p.dm && !p.force)
      return out_({ok:false,error:'date-mismatch',rowDate:dm_(rowDate),sheet:sh.getName()});
    var head=data[0].map(norm_), n=0, miss=[];
    function put(k,val){var c=head.indexOf(norm_(k)); if(c<0){miss.push(k);return} sh.getRange(row+1,c+1).setValue(val); n++}
    for(var k in (p.values||{})) if(p.values[k]!==null) put(k,p.values[k]);
    for(var k2 in (p.checks||{})) put(k2,!!p.checks[k2]);
    return out_({ok:true,sheet:sh.getName(),row:row+1,rowDate:dm_(rowDate),written:n,missing:miss});
  }catch(err){return out_({ok:false,error:String(err)})}
}
