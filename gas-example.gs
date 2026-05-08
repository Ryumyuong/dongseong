/**
 * 법무법인 동승 — 상담 신청 폼 수신용 Google Apps Script 예제
 *
 * 사용 방법:
 * 1) 구글 시트(스프레드시트)를 새로 하나 만든다.
 * 2) "확장 프로그램 → Apps Script" 메뉴로 들어가 이 파일 내용을 붙여넣는다.
 * 3) 상단의 SHEET_ID 상수에 시트 ID(URL의 /d/ 다음 부분)를 채운다.
 * 4) "배포 → 새 배포" 선택, 유형은 "웹 앱", 액세스는 "모든 사용자"로 설정.
 * 5) 배포 후 발급된 Web App URL을 복사해 script.js 상단 GAS_URL 상수에 붙여넣는다.
 *
 * 시트의 첫 줄에는 헤더(자동 생성됨)가 들어가고, 이후 신청이 들어올 때마다 한 줄씩 추가된다.
 */

const SHEET_ID = '여기에_스프레드시트_ID_입력';
const SHEET_NAME = '상담신청'; // 탭 이름. 없으면 자동 생성됨.

const HEADERS = [
  '접수일시',
  '폼 종류',
  '이름',
  '연락처',
  '총 채무 금액',
  '월 소득',
  '부양가족수',
  '문의사항',
  '동의 여부',
  'User-Agent'
];

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet_();

    sheet.appendRow([
      new Date(),
      payload.type || '',
      payload.name || '',
      payload.phone || '',
      payload.totalDebt || '',
      payload.monthlyIncome || '',
      payload.dependents || '',
      payload.message || '',
      payload.agree ? '동의' : '',
      payload.userAgent || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 헬스체크용 (브라우저로 URL 직접 접속 시 응답)
function doGet() {
  return ContentService
    .createTextOutput('OK — POST JSON to this endpoint to record a submission.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}
