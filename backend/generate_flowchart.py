import matplotlib.pyplot as plt
import matplotlib.patches as patches

def draw_flowchart():
    fig, ax = plt.subplots(figsize=(12, 14))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 12)
    ax.axis('off')

    # Helper to draw box
    def draw_box(x, y, w, h, text, color='#E6F3FF'):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", 
                                      linewidth=2, edgecolor='black', facecolor=color)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=11, fontweight='bold')
        return (x + w/2, y) # Return bottom center

    # Helper to draw diamond (Decision)
    def draw_diamond(x, y, text):
        diamond = patches.Polygon([[x, y+0.8], [x+1.5, y], [x, y-0.8], [x-1.5, y]], 
                                  closed=True, linewidth=2, edgecolor='black', facecolor='#FFE6E6')
        ax.add_patch(diamond)
        ax.text(x, y, text, ha='center', va='center', fontsize=10, fontweight='bold')
        return (x, y-0.8) # Return bottom tip

    # Helper to draw arrow
    def draw_arrow(x1, y1, x2, y2):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", lw=2, color='black'))

    # --- NODES ---

    # 1. Start / Input
    draw_box(3.5, 10.5, 3, 1.2, "START:\nUser Query / Market Tick")
    
    # Arrow
    draw_arrow(5, 10.5, 5, 9.7)

    # 2. Input Layer
    draw_box(2.5, 8.5, 5, 1.2, "INPUT LAYER:\nFetch Live API Data\n& Retrieve Knowledge Base")

    # Arrow to Split
    draw_arrow(5, 8.5, 5, 7.5)

    # 3. Processing (Parallel)
    # Left: LSTM
    draw_box(0.5, 5.5, 2.5, 1.5, "LSTM Model\n(Price Forecasting)", color='#E6FFEC')
    # Middle: Random Forest
    draw_box(3.75, 5.5, 2.5, 1.5, "Random Forest\n(Risk Classification)", color='#E6FFEC')
    # Right: RAG
    draw_box(7, 5.5, 2.5, 1.5, "RAG System\n(Context Retrieval)", color='#FFF0E6')

    # Arrows from Split
    # To Left
    ax.plot([5, 5, 1.75, 1.75], [8.5, 7.8, 7.8, 7.1], color='black', lw=2)
    draw_arrow(1.75, 7.1, 1.75, 7.1) # arrowhead logic handled by annotate usually, fixing manually below
    ax.annotate("", xy=(1.75, 7.1), xytext=(1.75, 7.8), arrowprops=dict(arrowstyle="->", lw=2))
    
    # To Middle
    draw_arrow(5, 8.5, 5, 7.1)

    # To Right
    ax.plot([5, 5, 8.25, 8.25], [8.5, 7.8, 7.8, 7.1], color='black', lw=2)
    ax.annotate("", xy=(8.25, 7.1), xytext=(8.25, 7.8), arrowprops=dict(arrowstyle="->", lw=2))


    # 4. Decision Node (Risk Check)
    # Using Middle flows into decision
    draw_arrow(5, 5.5, 5, 4.3)
    draw_diamond(5, 3.5, "Is Risk\nHigh?")

    # Yes Path
    ax.annotate("Yes", xy=(6.8, 3.5), xytext=(5.8, 3.5), fontsize=10)
    draw_arrow(6.5, 3.5, 7.5, 3.5)
    draw_box(7.5, 2.9, 2, 1.2, "Flag Warning\n& Explain", color='#FFCCCB')

    # No Path
    draw_arrow(5, 2.7, 5, 2.0)
    
    # 5. Synthesis / Output
    draw_box(2.5, 0.5, 5, 1.2, "OUTPUT LAYER:\nDisplay Dashboard &\nChat Response", color='#E6F3FF')

    # Connect all to Output
    # Left (LSTM) to Output
    ax.plot([1.75, 1.75, 3.5], [5.5, 2.0, 1.8], color='black', lw=2) # Simple curve approx
    ax.annotate("", xy=(3.5, 1.8), xytext=(1.75, 2.5), arrowprops=dict(arrowstyle="->", lw=2))

    # Decision (No) to Output
    draw_arrow(5, 2.7, 5, 1.8)

    # Flag Warning to Output
    ax.plot([8.5, 8.5, 6.5], [2.9, 2.0, 1.8], color='black', lw=2)
    ax.annotate("", xy=(6.5, 1.8), xytext=(8.5, 2.0), arrowprops=dict(arrowstyle="->", lw=2))
    
    # RAG to Output
    ax.plot([8.25, 8.25, 6.0], [5.5, 4.5, 1.8], color='black', lw=2) 
    # Just direct arrow from RAG block down to synthesis area effectively
    
    plt.tight_layout()
    output_path = "proper_flowchart.png"
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"Flowchart saved to {output_path}")

if __name__ == "__main__":
    draw_flowchart()
