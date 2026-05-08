from random import Random


def generate_demo_dataset(seed: int = 7, size: int = 500) -> list[dict]:
    rng = Random(seed)
    rows: list[dict] = []
    for _ in range(size):
        income = rng.uniform(2500, 16000)
        row = {
            "monthly_income": round(income, 2),
            "monthly_rent": round(income * rng.uniform(0.18, 0.42), 2),
            "monthly_food": round(income * rng.uniform(0.07, 0.17), 2),
            "monthly_transport": round(income * rng.uniform(0.02, 0.11), 2),
            "monthly_entertainment": round(income * rng.uniform(0.02, 0.16), 2),
            "credit_score": rng.randint(480, 830),
        }
        rows.append(row)
    return rows
