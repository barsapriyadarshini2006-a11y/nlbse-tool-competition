# NLBSE Tool Competition — MADE-WIC Vulnerability & SATD Classification

## Overview
This repository contains my submission for the **NLBSE Tool Competition**, using the 
**MADE-WIC** dataset for joint vulnerability and Self-Admitted Technical Debt (SATD) 
classification.

## Task
The competition requires training, tuning, and evaluating a classifier, plus a 2-4 page 
paper covering architecture, preprocessing, tuning procedure, and test results.

## Dataset
**MADE-WIC**: functions mined from open-source projects, each with source code and 
associated comments, annotated with:
- A **vulnerability** label (source-code component)
- A **SATD** label (comment component)

Split across three files: OSPR, BigVul, Devign (train/validation public; hidden test set 
used only by organisers). Dataset not included in this repo due to file size — see the 
[MADE-WIC replication package](https://doi.org/10.5281/zenodo.12567874) (ASE 2024).

## Approach So Far
- Stratified 80/20 train/test splits
- TF-IDF vectorization
- Models trained: Multinomial Naive Bayes, Logistic Regression (balanced), Linear SVM (balanced)
- Evaluated separately for SATD (from LeadingComment) and Vulnerability (from Function) labels

## Results
| Task | Best Model | F1 Score |
|---|---|---|
| SATD | Linear SVM | 0.1467 (severe class imbalance: 0.85% positive) |
| Vulnerability | Linear SVM | 0.7743 (31.92% positive, richer signal) |

## Next Steps
- Understand complete.csv dataset fully
- Learn CodeBERT basics (architecture, parameters, training data)
- Compare BERT variants (SciBERT vs CodeBERT) — required for competition
- Experiment with different train/val/test splits (70/20/10, 80/20, 70/30, 90/10)
- Explore normalization techniques (min-max, z-score, decimal scaling)
- Optional: fine-tune a transformer model for classification

## Repository Structure
NLBSE_tool_selection/
├── explore.ipynb # Main analysis notebook
├── Dataset/ # (excluded from Git — see .gitignore)
├── Replication/ # Dataset replication package materials
└── README.md

## Author
Barsa Priyadarshini — B.Tech CSE (AI/ML), CV Raman Global University, Odisha
