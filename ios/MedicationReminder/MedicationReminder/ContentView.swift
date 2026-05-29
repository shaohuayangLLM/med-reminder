import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct ContentView: View {
    @EnvironmentObject private var store: AppStore
    @State private var activeSheet: Sheet?
    @State private var selectedTab: RecordTab = .logs
    @State private var message: String?

    private var status: DoseStatus? {
        guard let cartridge = store.state.currentCartridge else { return nil }
        return calculateDoseStatus(cartridge: cartridge, today: todayString())
    }

    private var level: AlertLevel {
        guard let status else { return .none }
        return alertLevel(remainingDoses: status.remainingDoses, currentDailyDoses: status.currentDailyDoses)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if let status {
                    StatusView(status: status, level: level)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .padding(.horizontal, 16)
                } else {
                    EmptyStateView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }

                VStack(spacing: 12) {
                    ActionPanel(
                        hasCartridge: store.state.currentCartridge != nil,
                        currentDailyDoses: status?.currentDailyDoses ?? 3,
                        activeSheet: $activeSheet
                    )

                    RecordsView(
                        logs: store.state.operationLogs,
                        history: store.state.history,
                        selectedTab: $selectedTab,
                        onDeleteHistory: store.deleteHistory,
                        onExport: exportData,
                        onImport: { activeSheet = .data }
                    )
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 20)
            }
            .background(Color.white)
            .navigationTitle("用药提醒")
            .navigationBarTitleDisplayMode(.inline)
            .overlay(alignment: .top) {
                if let message {
                    Text(message)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(.black.opacity(0.9), in: Capsule())
                        .padding(.top, 8)
                }
            }
            .sheet(item: $activeSheet) { sheet in
                sheetView(sheet)
                    .presentationDetents(sheet.detents)
                    .presentationDragIndicator(.hidden)
                    .presentationCornerRadius(28)
                    .presentationBackground(.white)
            }
            .onAppear {
                store.refreshNotification(status: status, level: level)
            }
        }
    }

    @ViewBuilder
    private func sheetView(_ sheet: Sheet) -> some View {
        switch sheet {
        case .new:
            NewCartridgeSheet { total, daily in
                store.startNewCartridge(totalDoses: total, dailyDoses: daily)
                activeSheet = nil
            }
        case .adjust:
            AdjustSheet { remaining in
                store.adjustRemainingDoses(remaining)
                activeSheet = nil
            }
        case .daily(let currentDaily):
            DailyDoseSheet(currentDailyDoses: currentDaily) { daily, date in
                let before = status
                store.changeDailyDoses(daily, effectiveDate: date)
                if let before {
                    showMessage("每日 \(before.currentDailyDoses)→\(daily) 次 · 可用 \(before.remainingDays)→\(before.remainingDoses / daily) 天")
                }
                activeSheet = nil
            }
        case .data:
            DataSheet(
                exportJSON: store.exportJSON(),
                onImport: { json in
                    showMessage(store.importJSON(json) ? "已恢复" : "数据格式错误")
                    activeSheet = nil
                }
            )
        }
    }

    private func exportData() {
        let json = store.exportJSON()
        #if canImport(UIKit)
        UIPasteboard.general.string = json
        #endif
        showMessage("已复制到剪贴板")
    }

    private func showMessage(_ value: String) {
        message = value
        Task {
            try? await Task.sleep(for: .seconds(2))
            message = nil
        }
    }
}

private enum Sheet: Identifiable {
    case new
    case adjust
    case daily(Int)
    case data

    var id: String {
        switch self {
        case .new: "new"
        case .adjust: "adjust"
        case .daily: "daily"
        case .data: "data"
        }
    }

    var detents: Set<PresentationDetent> {
        switch self {
        case .new: [.height(330)]
        case .adjust: [.height(250)]
        case .daily: [.height(340)]
        case .data: [.medium, .large]
        }
    }
}

private enum RecordTab: String, CaseIterable, Identifiable {
    case logs = "操作记录"
    case history = "开药记录"

    var id: String { rawValue }
}

private struct StatusView: View {
    var status: DoseStatus
    var level: AlertLevel

    private var tint: Color {
        switch level {
        case .none: .black
        case .warning: Color(red: 1, green: 0.58, blue: 0)
        case .urgent: Color(red: 1, green: 0.23, blue: 0.19)
        }
    }

    private var subtitle: String {
        switch level {
        case .none: "药量充足"
        case .warning: "该准备新药了"
        case .urgent: "请尽快换药"
        }
    }

    var body: some View {
        VStack(spacing: 18) {
            ZStack {
                Circle()
                    .stroke(tint.opacity(0.12), lineWidth: 8)
                Circle()
                    .trim(from: 0, to: max(0, min(1, Double(status.remainingDoses) / Double(max(status.totalDoses, 1)))))
                    .stroke(tint, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 4) {
                    Text("\(status.remainingDoses)")
                        .font(.system(size: 52, weight: .semibold))
                    Text("剩余次数")
                        .font(.system(size: 15))
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 200, height: 200)

            VStack(spacing: 6) {
                Text(subtitle)
                    .font(.system(size: 17, weight: .semibold))
                Text("预计可用 \(status.remainingDays) 天 · \(status.estimatedEndDate) 用完")
                    .font(.system(size: 15))
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 8) {
                MetricView(title: "每日", value: "\(status.currentDailyDoses) 次")
                MetricView(title: "已用", value: "\(status.usedDoses) 次")
                MetricView(title: "总量", value: "\(status.totalDoses) 次")
            }
        }
    }
}

private struct MetricView: View {
    var title: String
    var value: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 17, weight: .semibold))
            Text(title)
                .font(.system(size: 13))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 64)
        .background(Color(red: 0.965, green: 0.965, blue: 0.965), in: RoundedRectangle(cornerRadius: 14))
    }
}

private struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 8) {
            Text("Rx")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 46, height: 46)
                .background(.black, in: Circle())
                .padding(.bottom, 8)
            Text("还没有正在使用的药剂")
                .font(.system(size: 17, weight: .semibold))
            Text("点击下方「开新药」开始记录")
                .font(.system(size: 15))
                .foregroundStyle(.secondary)
        }
    }
}

private struct ActionPanel: View {
    var hasCartridge: Bool
    var currentDailyDoses: Int
    @Binding var activeSheet: Sheet?

    var body: some View {
        VStack(spacing: 8) {
            Button("开新药") {
                activeSheet = .new
            }
            .buttonStyle(PrimaryButtonStyle())

            if hasCartridge {
                HStack(spacing: 8) {
                    Button("修正次数") { activeSheet = .adjust }
                    Button("调整每日") { activeSheet = .daily(currentDailyDoses) }
                }
                .buttonStyle(SecondaryButtonStyle())
            }
        }
    }
}

private struct RecordsView: View {
    var logs: [OperationLog]
    var history: [Cartridge]
    @Binding var selectedTab: RecordTab
    var onDeleteHistory: (String) -> Void
    var onExport: () -> Void
    var onImport: () -> Void

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Picker("", selection: $selectedTab) {
                    ForEach(RecordTab.allCases) { tab in
                        Text(tab.rawValue).tag(tab)
                    }
                }
                .pickerStyle(.segmented)

                Button("导出", action: onExport)
                    .font(.system(size: 13, weight: .medium))
                Button("导入", action: onImport)
                    .font(.system(size: 13, weight: .medium))
            }

            if selectedTab == .logs {
                ListPreview(items: logs.suffix(5).map { "\($0.timestamp.prefix(16))  \($0.action)  \($0.detail)" })
            } else {
                HistoryPreview(history: history, onDelete: onDeleteHistory)
            }
        }
    }
}

private struct ListPreview: View {
    var items: [String]

    var body: some View {
        VStack(spacing: 8) {
            if items.isEmpty {
                Text("暂无记录")
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 44)
            } else {
                ForEach(items, id: \.self) { item in
                    Text(item)
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 12)
                        .frame(height: 36)
                        .background(Color(red: 0.965, green: 0.965, blue: 0.965), in: RoundedRectangle(cornerRadius: 12))
                }
            }
        }
    }
}

private struct HistoryPreview: View {
    var history: [Cartridge]
    var onDelete: (String) -> Void

    var body: some View {
        VStack(spacing: 8) {
            if history.isEmpty {
                Text("暂无开药记录")
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 44)
            } else {
                ForEach(history.suffix(5)) { cartridge in
                    HStack {
                        Text("\(cartridge.startDate) · 总\(cartridge.totalDoses)次")
                            .font(.system(size: 13))
                            .foregroundStyle(.secondary)
                        Spacer()
                        Button("删除") { onDelete(cartridge.id) }
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(.red)
                    }
                    .padding(.horizontal, 12)
                    .frame(height: 36)
                    .background(Color(red: 0.965, green: 0.965, blue: 0.965), in: RoundedRectangle(cornerRadius: 12))
                }
            }
        }
    }
}

private struct NewCartridgeSheet: View {
    @State private var total = "60"
    @State private var daily = "3"
    var onSubmit: (Int, Int) -> Void

    private var canSubmit: Bool {
        guard let totalValue = Int(total), let dailyValue = Int(daily) else { return false }
        return totalValue > 0 && dailyValue > 0
    }

    var body: some View {
        BottomSheetForm(title: "开新药") {
            NumberField(title: "总次数", text: $total)
            NumberField(title: "每日次数", text: $daily)
            ConfirmButton(isEnabled: canSubmit) {
                if let totalValue = Int(total), let dailyValue = Int(daily) {
                    onSubmit(totalValue, dailyValue)
                }
            }
        }
    }
}

private struct AdjustSheet: View {
    @State private var remaining = ""
    var onSubmit: (Int) -> Void

    private var canSubmit: Bool {
        guard let value = Int(remaining) else { return false }
        return value >= 0
    }

    var body: some View {
        BottomSheetForm(title: "修正次数") {
            NumberField(title: "当前剩余次数", text: $remaining)
            ConfirmButton(isEnabled: canSubmit) {
                if let value = Int(remaining) {
                    onSubmit(value)
                }
            }
        }
    }
}

private struct DailyDoseSheet: View {
    var currentDailyDoses: Int
    @State private var daily: String
    @State private var effectiveWhen = 0
    var onSubmit: (Int, String) -> Void

    init(currentDailyDoses: Int, onSubmit: @escaping (Int, String) -> Void) {
        self.currentDailyDoses = currentDailyDoses
        self.onSubmit = onSubmit
        _daily = State(initialValue: String(currentDailyDoses))
    }

    private var canSubmit: Bool {
        guard let value = Int(daily) else { return false }
        return value > 0
    }

    var body: some View {
        BottomSheetForm(title: "调整每日") {
            NumberField(title: "每日次数", text: $daily)
            VStack(alignment: .leading, spacing: 8) {
                Text("何时生效")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.secondary)
                Picker("何时生效", selection: $effectiveWhen) {
                    Text("今天生效").tag(0)
                    Text("明天生效").tag(1)
                }
                .pickerStyle(.segmented)
            }
            ConfirmButton(isEnabled: canSubmit) {
                if let value = Int(daily) {
                    onSubmit(value, effectiveDate)
                }
            }
        }
    }

    private var effectiveDate: String {
        guard effectiveWhen == 1 else { return todayString() }
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: Date()) ?? Date()
        return dateString(from: tomorrow)
    }
}

private struct BottomSheetForm<Content: View>: View {
    var title: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(spacing: 0) {
            Capsule()
                .fill(Color(red: 0.78, green: 0.78, blue: 0.8))
                .frame(width: 34, height: 5)
                .padding(.top, 12)
                .padding(.bottom, 28)

            VStack(alignment: .leading, spacing: 22) {
                Text(title)
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(.black)

                content
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 24)

            Spacer(minLength: 0)
        }
        .background(.white)
    }
}

private struct NumberField: View {
    var title: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.secondary)
            TextField("", text: $text)
                .keyboardType(.numberPad)
                .font(.system(size: 24, weight: .medium))
                .foregroundStyle(.black)
                .padding(.horizontal, 16)
                .frame(height: 54)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(.white)
                        .stroke(Color(red: 0.88, green: 0.88, blue: 0.9), lineWidth: 1)
                )
        }
    }
}

private struct ConfirmButton: View {
    var isEnabled: Bool = true
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text("确认")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 58)
                .background(isEnabled ? .black : Color(red: 0.7, green: 0.7, blue: 0.72), in: RoundedRectangle(cornerRadius: 14))
        }
        .disabled(!isEnabled)
        .buttonStyle(.plain)
    }
}

private struct DataSheet: View {
    var exportJSON: String
    @State private var importText = ""
    var onImport: (String) -> Void

    var body: some View {
        Form {
            Section("导出数据") {
                Text(exportJSON)
                    .font(.system(size: 12, design: .monospaced))
                    .textSelection(.enabled)
            }
            Section("导入数据") {
                TextEditor(text: $importText)
                    .frame(minHeight: 120)
                Button("恢复") {
                    onImport(importText)
                }
            }
        }
    }
}

private struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .medium))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(.black, in: RoundedRectangle(cornerRadius: 14))
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
    }
}

private struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .medium))
            .foregroundStyle(.black)
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Color(red: 0.965, green: 0.965, blue: 0.965), in: RoundedRectangle(cornerRadius: 14))
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
    }
}
