# language: zh-TW
Feature: 電子簽名
  作為 美容師
  我希望 能讓飼主在電腦上電子簽名並將簽名嵌入契約 PDF
  以便 完成契約簽署流程

  Background:
    Given 系統已啟動且資料目錄已建立
    And 系統中已有飼主「王小明」名下寵物「Lucky」
    And 「Lucky」已有一筆美容紀錄且已產生契約 PDF

  # ===== 簽名板元件 =====

  Scenario: 前端提供簽名板元件
    When 美容師開啟電子簽名畫面
    Then 系統應顯示簽名板元件
    And 簽名板應支援滑鼠手寫簽名
    And 簽名板應支援觸控螢幕手寫簽名

  Scenario: 飼主在簽名板上手寫簽名
    Given 美容師已開啟電子簽名畫面
    When 飼主在簽名板上手寫簽名
    Then 簽名板應即時顯示簽名軌跡

  # ===== 清除重簽 =====

  Scenario: 飼主清除簽名重新簽名
    Given 飼主已在簽名板上完成簽名
    When 飼主按下清除重簽按鈕
    Then 簽名板應清空所有簽名內容
    And 飼主可重新在簽名板上手寫簽名

  # ===== 確認簽名 =====

  Scenario: 飼主確認簽名後簽名圖片傳送至後端
    Given 飼主已在簽名板上完成簽名
    When 飼主按下確認簽名按鈕
    Then 系統應將簽名圖片傳送至後端

  Scenario: 確認簽名前顯示簽名預覽
    Given 飼主已在簽名板上完成簽名
    When 飼主查看簽名預覽
    Then 系統應顯示簽名的預覽畫面

  # ===== 簽名嵌入 PDF =====

  Scenario: 簽名圖片嵌入 PDF 第 3 頁甲方簽章位置
    Given 飼主已確認簽名並上傳至後端
    When 後端處理簽名嵌入
    Then 簽名圖片應嵌入 PDF 第 3 頁甲方簽章位置

  Scenario: 簽名圖片嵌入 PDF 第 4 頁飼主簽名位置
    Given 飼主已確認簽名並上傳至後端
    When 後端處理簽名嵌入
    Then 簽名圖片應嵌入 PDF 第 4 頁飼主簽名位置

  Scenario: 簽名嵌入後 PDF 重新保存
    Given 飼主已確認簽名並上傳至後端
    When 後端將簽名嵌入 PDF 第 3 頁與第 4 頁
    Then 嵌入簽名後的 PDF 應重新保存
    And 保存後的 PDF 應可下載與列印

  # ===== 簽名嵌入完整流程 =====

  Scenario: 完整電子簽名流程 - 從簽名到嵌入 PDF
    Given 美容師開啟電子簽名畫面
    When 飼主在簽名板上手寫簽名
    And 飼主按下確認簽名按鈕
    Then 系統應將簽名圖片傳送至後端
    And 後端應將簽名圖片嵌入 PDF 第 3 頁甲方簽章位置
    And 後端應將簽名圖片嵌入 PDF 第 4 頁飼主簽名位置
    And 嵌入簽名後的 PDF 應重新保存
    And 系統應顯示簽名完成的提示

  # ===== 異常處理 =====

  Scenario: 未簽名就按確認 - 系統拒絕
    Given 美容師已開啟電子簽名畫面
    And 飼主尚未在簽名板上簽名
    When 飼主按下確認簽名按鈕
    Then 系統應顯示請先完成簽名的提示訊息
    And 簽名不應被傳送至後端

  Scenario: 簽名上傳失敗時顯示錯誤訊息
    Given 飼主已在簽名板上完成簽名
    And 後端 API 發生錯誤
    When 飼主按下確認簽名按鈕
    Then 系統應顯示簽名上傳失敗的錯誤訊息
    And 飼主可重新嘗試確認簽名

  Scenario: 契約 PDF 不存在時無法進行簽名
    Given 「Lucky」的美容紀錄尚未產生契約 PDF
    When 美容師嘗試開啟電子簽名畫面
    Then 系統應提示需先產生契約 PDF
