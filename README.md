
# HACK<span style="color:#ef4444">X</span> | Financial Crime Forensic Unit

![Version](https://img.shields.io/badge/version-2.0.4-blue.svg?style=for-the-badge)
![Status](https://img.shields.io/badge/system-LIVE-green.svg?style=for-the-badge)
![Tech](https://img.shields.io/badge/tech-React_Vite_Tailwind-38bdf8.svg?style=for-the-badge)

A military-grade, graph-based financial crime detection terminal designed for forensic analysts. **HackX** visualizes complex transaction networks to identify Money Laundering Rings, Smurfing Patterns, and Shell Companies in real-time.

---

## 🚀 **System Capabilities**

### 1. **Graph-Based Forensics**
*   **Force-Directed Layout**: Interactive visualization of accounts (nodes) and transactions (edges).
*   **Risk Heatmap**: Nodes dynamically colored by risk score (Critical: Red, Warning: Yellow, Safe: Green).
*   **Temporal Scrubbing**: Time-travel slider to filter transactions within specific windows (e.g., "72h flow analysis").

### 2. **Advanced Detection Algorithms (DLS-Depth-5)**
The engine automatically flags suspicious patterns:
*   🔴 **Cycle Detection**: Identifies circular money flows (A -> B -> C -> A).
*   🟠 **Fan-In / Fan-Out**: Detects mule accounts aggregating funds or dispersing illicit proceeds.
*   🟣 **Shell Company Structuring**: Flags low-volume, high-frequency "layering" behavior.

### 3. **High-Fidelity Terminal UI**
*   **Bento Grid Architecture**: Dense, data-rich layout with Metrics, Graph, and Data Tables.
*   **Glassmorphism 2.0**: `backdrop-blur-xl` panels with obsidian backgrounds (`#020617`).
*   **Interactive Details**: Sidebar overlay with transaction velocity histograms and centrality metrics.

---

## 🛠 **Installation & Deployment**

### **Prerequisites**
*   Node.js v18+
*   npm v9+

### **Setup Protocol**
```bash
# 1. Clone the repository
git clone https://github.com/your-username/HackX.git

# 2. Enter the secure environment
cd HackX

# 3. Install core dependencies
npm install

# 4. Initialize the forensic engine
npm run dev
```

The terminal will launch at `http://localhost:5173`.

---

## 🖥 **Usage Intelligence**

1.  **Ingest Data**: Drag & Drop a CSV file containing transaction logs.
2.  **Analyze Topology**:
    *   **Zoom/Pan**: Explore the graph network.
    *   **Click Node**: Open the "Suspect Profile" sidebar.
    *   **Scrub Time**: Use the bottom slider to narrow down specific timestamps.
3.  **Investigate Rings**:
    *   Select a detected ring from the right-hand table.
    *   The graph will auto-focus and highlight the specific ring members.
4.  **Export Report**: Click "EXPORT REPORT" in the header to download a JSON case file.

---

## 🏗 **Architecture**

*   **Frontend**: React 18, Vite, TypeScript
*   **Styling**: Tailwind CSS, Lucide Icons
*   **Visualization**: `react-force-graph-2d`
*   **Logic**: Custom `Deep Link Search (DLS)` Algorithm

---

> _"In the digital age, follow the money, find the ghost."_
