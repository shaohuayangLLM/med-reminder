import Foundation

let currentSchemaVersion = 3

struct DosageChange: Codable, Equatable, Identifiable {
    var id: String { date }
    var date: String
    var dailyDoses: Int
}

struct ManualAdjustment: Codable, Equatable, Identifiable {
    var id: String { date }
    var date: String
    var remainingDoses: Int
}

struct Cartridge: Codable, Equatable, Identifiable {
    var id: String
    var totalDoses: Int
    var startDate: String
    var endDate: String?
    var dosageChanges: [DosageChange]
    var manualAdjustments: [ManualAdjustment]
}

struct OperationLog: Codable, Equatable, Identifiable {
    var id: String { timestamp + action + detail }
    var timestamp: String
    var action: String
    var detail: String
}

struct AppState: Codable, Equatable {
    var version: Int
    var currentCartridge: Cartridge?
    var history: [Cartridge]
    var notificationEnabled: Bool
    var operationLogs: [OperationLog]

    static let empty = AppState(
        version: currentSchemaVersion,
        currentCartridge: nil,
        history: [],
        notificationEnabled: false,
        operationLogs: []
    )
}

enum AlertLevel: String, Equatable {
    case none
    case warning
    case urgent
}

func alertLevel(remainingDoses: Int, currentDailyDoses: Int) -> AlertLevel {
    if remainingDoses <= currentDailyDoses { return .urgent }
    if remainingDoses <= 21 { return .warning }
    return .none
}
