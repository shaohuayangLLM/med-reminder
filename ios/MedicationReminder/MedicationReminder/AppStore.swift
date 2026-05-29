import Foundation
import UserNotifications

@MainActor
final class AppStore: ObservableObject {
    @Published private(set) var state: AppState

    private let storageKey = "medication-reminder-state"

    init() {
        state = Self.load(storageKey: storageKey)
    }

    func startNewCartridge(totalDoses: Int, dailyDoses: Int) {
        guard totalDoses > 0, dailyDoses > 0 else { return }
        let today = todayString()
        let cartridge = Cartridge(
            id: UUID().uuidString,
            totalDoses: totalDoses,
            startDate: today,
            dosageChanges: [DosageChange(date: today, dailyDoses: dailyDoses)],
            manualAdjustments: []
        )

        if let current = state.currentCartridge {
            var ended = current
            ended.endDate = today
            state.history.append(ended)
        }

        state.currentCartridge = cartridge
        addLog(action: "开新药", detail: "总\(totalDoses)次 每日\(dailyDoses)次")
        save()
    }

    func adjustRemainingDoses(_ remainingDoses: Int) {
        guard remainingDoses >= 0, state.currentCartridge != nil else { return }
        state.currentCartridge?.manualAdjustments.append(
            ManualAdjustment(date: todayString(), remainingDoses: remainingDoses)
        )
        addLog(action: "修正次数", detail: "剩余修正为 \(remainingDoses)次")
        save()
    }

    func changeDailyDoses(_ dailyDoses: Int, effectiveDate: String) {
        guard dailyDoses > 0, let cartridge = state.currentCartridge else { return }
        let currentDaily = cartridge.dosageChanges
            .filter { $0.date <= effectiveDate }
            .sorted { $0.date < $1.date }
            .last?.dailyDoses ?? 0
        let when = effectiveDate == todayString() ? "今天生效" : "\(effectiveDate)生效"

        state.currentCartridge?.dosageChanges.append(DosageChange(date: effectiveDate, dailyDoses: dailyDoses))
        addLog(action: "调整每日", detail: "\(currentDaily)→\(dailyDoses)次 \(when)")
        save()
    }

    func deleteHistory(id: String) {
        state.history.removeAll { $0.id == id }
        save()
    }

    func exportJSON() -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let data = try? encoder.encode(state) else { return "{}" }
        return String(data: data, encoding: .utf8) ?? "{}"
    }

    func importJSON(_ json: String) -> Bool {
        guard let data = json.data(using: .utf8),
              var imported = try? JSONDecoder().decode(AppState.self, from: data)
        else { return false }

        imported.version = currentSchemaVersion
        state = imported
        save()
        return true
    }

    func refreshNotification(status: DoseStatus?, level: AlertLevel) {
        guard let status, level != .none else { return }
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { [weak self] granted, _ in
            guard granted else { return }
            Task { @MainActor in
                self?.state.notificationEnabled = true
                self?.save()
            }

            let content = UNMutableNotificationContent()
            content.title = "用药提醒"
            content.body = level == .urgent ? "药剂即将用完，请尽快换药。" : "剩余约 \(status.remainingDays) 天，该准备新药了。"
            content.sound = .default

            let request = UNNotificationRequest(
                identifier: "medication-stock-alert",
                content: content,
                trigger: UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
            )
            UNUserNotificationCenter.current().add(request)
        }
    }

    private func addLog(action: String, detail: String) {
        state.operationLogs.append(OperationLog(timestamp: timestampString(), action: action, detail: detail))

        let cutoff = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        let cutoffString = String(formatter.string(from: cutoff).prefix(19))
        state.operationLogs = state.operationLogs.filter { $0.timestamp >= cutoffString }
    }

    private func save() {
        state.version = currentSchemaVersion
        if let data = try? JSONEncoder().encode(state) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    private static func load(storageKey: String) -> AppState {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              var state = try? JSONDecoder().decode(AppState.self, from: data)
        else { return .empty }

        state.version = currentSchemaVersion
        return state
    }
}
