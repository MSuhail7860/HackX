HackX Intelligence
HackX Intelligence is a high-performance financial forensic platform designed to identify complex money laundering rings and fraudulent transaction patterns using advanced graph theory and temporal analysis. It provides investigators with a "Financial Crime Forensic Unit" dashboard to visualize, analyze, and dismantle illicit financial flows in real-time.

Core Features
1. Advanced Detection Engine
The platform utilizes a custom AnalysisEngine that processes transaction data through several specialized algorithms:

Recursive Cycle Detection: Uses Depth-Limited Search (DLS) to identify circular fund movements (e.g., A → B → C → A) where money eventually returns to the original sender.

Smurfing (Structuring) Analysis: Monitors "Fan-in" and "Fan-out" patterns to detect when multiple small transfers are consolidated or dispersed within a strict 72-hour window.

Layered Shell Identification: Detects chains of "shell" accounts—nodes characterized by very low transaction counts (typically ≤ 3) used solely to pass funds through the network.

High-Volume Whitelisting: Implements a control mechanism to exclude legitimate high-volume merchants from being flagged as fraud hubs, reducing false positives.

2. Interactive Forensic Dashboard
The user interface is built for deep-dive investigations with a modern, "cyber-forensic" aesthetic:

Network Topology Visualization: An interactive 2D force-graph that highlights accounts by risk level—Critical (Red), Warning (Yellow), or Clear (Green).

Temporal Scrubbing: A time-range slider that allows users to "scrub" through history to observe how transaction patterns and fraud rings evolved chronologically.

Explainable AI (Reasoning): Rather than just flagging an account, the system provides specific reasoning (e.g., "Abnormal transaction density detected within 72h window") for every detected ring.

3. Reporting & Compliance
RIFT 2026 Schema: Exportable forensic reports generated in JSON format that follow strict regulatory reporting standards.

System Summary: Real-time metrics on total transactions, volume analyzed, and critical threats detected.

Technical Stack
Frontend: React 19, Vite, Tailwind CSS.

Visualization: react-force-graph-2d for network rendering.

Analysis Engine: Custom TypeScript engine for graph traversal and pattern matching.

Database: PostgreSQL with Prisma ORM, optimized for recursive queries and pattern detection.

Icons: Lucide-React.

Getting Started
Clone the Repository:

Bash
git clone https://github.com/msuhail7860/hackx.git
Install Dependencies:

Bash
npm install
Run Development Server:

Bash
npm run dev
Analyze Data: Upload a .csv transaction file or click "Load Demo" to see the engine in action.
