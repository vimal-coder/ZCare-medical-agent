
from langgraph.graph import StateGraph, END
from agent.state import MedicalAgentState
from agent.nodes import analyze_document_node

# 1. Initialize the graph with our custom State
workflow = StateGraph(MedicalAgentState)

# 2. Add our processing node
workflow.add_node("analyze", analyze_document_node)

# 3. Define the edges (the flow of the application)
workflow.set_entry_point("analyze")
workflow.add_edge("analyze", END)

# 4. Compile the workflow into a runnable agent
medical_agent = workflow.compile()