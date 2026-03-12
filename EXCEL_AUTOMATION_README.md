# 📊 Excel 自动化示例项目

## 已创建的文件

| 文件 | 说明 |
|------|------|
| `demo_portfolio.xlsx` | Excel模板 - 可直接打开使用 |
| `excel_automation_demo.py` | 生成Excel的脚本 |
| `excel_auto_update.py` | 自动更新数据的脚本 |

## 🎯 演示内容 (可展示给客户)

### 1. 投资组合追踪表
- 实时显示持仓股票
- 自动计算盈亏
- 条件格式 (绿色=盈利, 红色=亏损)
- 可视化图表

### 2. 交易信号表
- 买入/卖出/持有信号
- 价格提示
- 状态跟踪

### 3. 自动更新功能
- 每日自动更新股价
- 自动生成日报
- 定时任务支持

## 🚀 如何使用

### 方式1: 直接打开Excel
```bash
open ~/Desktop/Stock_Analysis/demo_portfolio.xlsx
```

### 方式2: 运行自动更新
```bash
cd ~/Desktop/Stock_Analysis
python3 excel_auto_update.py
```

### 方式3: 定时自动运行 (每日早上9点)
添加到 crontab:
```bash
crontab -e
# 添加行:
# 0 9 * * 1-5 cd ~/Desktop/Stock_Analysis && python3 excel_auto_update.py
```

## 💰 可以销售的功能

| 功能 | 价格 |
|------|------|
| 基础模板 | ¥500-1,000 |
| 自动更新+API | ¥1,500-3,000 |
| 完整管理系统 | ¥5,000-15,000 |

## 🔧 技术栈

- Python + openpyxl
- Excel 公式
- 条件格式
- VBA 宏 (可选)

---
Created by Super Brain 🧠
