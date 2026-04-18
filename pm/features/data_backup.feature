# language: zh-TW
Feature: 資料備份與匯出
  作為 美容師
  我希望 能一鍵備份所有系統資料與契約 PDF
  以便 防止資料遺失並可隨時還原

  Background:
    Given 系統已啟動且資料目錄已建立

  # ===== 一鍵備份 =====

  Scenario: 美容師成功執行一鍵備份
    Given 系統中已有飼主、寵物、預約與美容紀錄資料
    And 系統中已有已產生的契約 PDF 檔案
    When 美容師在資料備份頁按下一鍵備份按鈕
    Then 系統應成功執行備份
    And 備份應包含所有 JSON 資料檔案（owners.json、pets.json、appointments.json、grooming-records.json、settings.json）
    And 備份應包含所有已產生的契約 PDF 檔案
    And 備份檔案應包含時間戳記
    And 系統應顯示備份成功的提示

  Scenario: 備份檔案包含時間戳記避免覆蓋舊備份
    Given 美容師已執行過一次備份
    When 美容師再次執行一鍵備份
    Then 新備份檔案的時間戳記應與舊備份不同
    And 舊備份檔案不應被覆蓋

  Scenario: 備份到指定位置
    When 美容師按下一鍵備份按鈕
    Then 備份檔案應保存到系統指定的備份位置

  # ===== 備份列表 =====

  Scenario: 查看備份檔案列表
    Given 系統已執行過多次備份
    When 美容師在資料備份頁查看備份列表
    Then 系統應顯示所有備份檔案的列表
    And 每筆備份應顯示時間戳記

  Scenario: 備份列表為空
    Given 系統尚未執行過任何備份
    When 美容師在資料備份頁查看備份列表
    Then 備份列表應為空
    And 系統應顯示尚無備份檔案的提示

  # ===== 備份介面 =====

  Scenario: 資料備份頁提供一鍵備份按鈕
    When 美容師開啟資料備份頁
    Then 頁面應顯示一鍵備份按鈕
    And 頁面應顯示備份檔案列表
    And 頁面應顯示備份狀態提示

  # ===== 跨平台備份 =====

  Scenario: Windows 環境下執行一鍵備份
    Given 系統運行在 Windows 環境
    When 美容師按下一鍵備份按鈕
    Then 系統應成功在 Windows 環境下完成備份

  Scenario: macOS 環境下執行一鍵備份
    Given 系統運行在 macOS 環境
    When 美容師按下一鍵備份按鈕
    Then 系統應成功在 macOS 環境下完成備份

  # ===== 異常處理 =====

  Scenario: 備份目錄沒有寫入權限時提示使用者
    Given 備份目錄沒有寫入權限
    When 美容師按下一鍵備份按鈕
    Then 系統應顯示無法寫入備份目錄的錯誤訊息
    And 系統應提示使用者調整目錄或權限

  Scenario: 系統中無任何資料時仍可執行備份
    Given 系統中尚無任何飼主、寵物或預約資料
    When 美容師按下一鍵備份按鈕
    Then 系統應成功執行備份
    And 備份應包含空的 JSON 資料檔案
