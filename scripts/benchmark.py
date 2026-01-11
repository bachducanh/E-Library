"""
Performance Benchmark Script
Compares query performance WITH and WITHOUT text index
"""

import time
from pymongo import MongoClient
import statistics

# MongoDB connection
MONGO_URI = "mongodb://localhost:27020/"
client = MongoClient(MONGO_URI)
db = client['elibrary']

# Test queries
TEST_QUERIES = [
    "Technology",
    "Computer Science",
    "History",
    "Vietnam",
    "Fiction",
    "Science",
    "Business",
    "Engineering",
    "Medicine",
    "Literature"
]

def benchmark_with_index(num_runs=30):
    """Benchmark queries WITH text index"""
    print("\n" + "="*60)
    print("BENCHMARK WITH TEXT INDEX")
    print("="*60)
    
    times = []
    
    for i in range(num_runs):
        query = TEST_QUERIES[i % len(TEST_QUERIES)]
        
        start_time = time.time()
        results = list(db.books.find(
            {"$text": {"$search": query}},
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})]).limit(10))
        end_time = time.time()
        
        duration_ms = (end_time - start_time) * 1000
        times.append(duration_ms)
        
        if (i + 1) % 10 == 0:
            print(f"  Completed {i + 1}/{num_runs} queries...")
    
    return times

def benchmark_without_index(num_runs=30):
    """Benchmark queries WITHOUT text index (using regex)"""
    print("\n" + "="*60)
    print("BENCHMARK WITHOUT TEXT INDEX (using regex)")
    print("="*60)
    
    times = []
    
    for i in range(num_runs):
        query = TEST_QUERIES[i % len(TEST_QUERIES)]
        
        start_time = time.time()
        # Simulate search without index using regex
        results = list(db.books.find({
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        }).limit(10))
        end_time = time.time()
        
        duration_ms = (end_time - start_time) * 1000
        times.append(duration_ms)
        
        if (i + 1) % 10 == 0:
            print(f"  Completed {i + 1}/{num_runs} queries...")
    
    return times

def print_statistics(label, times):
    """Print statistics for benchmark results"""
    print(f"\n{label}:")
    print(f"  Runs: {len(times)}")
    print(f"  Min:  {min(times):.2f} ms")
    print(f"  Max:  {max(times):.2f} ms")
    print(f"  Avg:  {statistics.mean(times):.2f} ms")
    print(f"  Med:  {statistics.median(times):.2f} ms")
    print(f"  P95:  {sorted(times)[int(len(times) * 0.95)]:.2f} ms")
    print(f"  P99:  {sorted(times)[int(len(times) * 0.99)]:.2f} ms")

def save_results(with_index_times, without_index_times):
    """Save results to database"""
    from datetime import datetime
    
    result_doc = {
        "timestamp": datetime.now(),
        "withIndex": {
            "times": with_index_times,
            "avg": statistics.mean(with_index_times),
            "min": min(with_index_times),
            "max": max(with_index_times),
            "p95": sorted(with_index_times)[int(len(with_index_times) * 0.95)]
        },
        "withoutIndex": {
            "times": without_index_times,
            "avg": statistics.mean(without_index_times),
            "min": min(without_index_times),
            "max": max(without_index_times),
            "p95": sorted(without_index_times)[int(len(without_index_times) * 0.95)]
        },
        "improvement": statistics.mean(without_index_times) / statistics.mean(with_index_times)
    }
    
    db.benchmarkResults.insert_one(result_doc)
    print(f"\n✓ Results saved to elibrary.benchmarkResults")

if __name__ == "__main__":
    print("="*60)
    print("E-LIBRARY PERFORMANCE BENCHMARK")
    print("="*60)
    print("\nThis benchmark compares full-text search performance")
    print("WITH text index vs WITHOUT text index (using regex)")
    print(f"\nTest queries: {', '.join(TEST_QUERIES)}")
    print(f"Number of runs: 30 (3 iterations of each query)")
    
    try:
        # Test connection
        client.admin.command('ping')
        print("\n✓ Connected to MongoDB")
        
        # Count books
        book_count = db.books.count_documents({})
        print(f"✓ Database has {book_count} books")
        
        # Check if text index exists
        indexes = db.books.index_information()
        has_text_index = any('text' in str(idx) for idx in indexes.values())
        
        if not has_text_index:
            print("\n⚠️  WARNING: Text index not found!")
            print("   Creating text index...")
            db.books.create_index([
                ("title", "text"),
                ("authors", "text"),
                ("subjects", "text"),
                ("description", "text")
            ])
            print("   ✓ Text index created")
        else:
            print("✓ Text index found")
        
        # Run benchmarks
        with_index_times = benchmark_with_index(30)
        without_index_times = benchmark_without_index(30)
        
        # Print results
        print("\n" + "="*60)
        print("RESULTS")
        print("="*60)
        
        print_statistics("WITH TEXT INDEX", with_index_times)
        print_statistics("WITHOUT INDEX (regex)", without_index_times)
        
        # Calculate improvement
        avg_with = statistics.mean(with_index_times)
        avg_without = statistics.mean(without_index_times)
        improvement = avg_without / avg_with
        
        print("\n" + "="*60)
        print("COMPARISON")
        print("="*60)
        print(f"  Average WITH index:    {avg_with:.2f} ms")
        print(f"  Average WITHOUT index: {avg_without:.2f} ms")
        print(f"  Improvement factor:    {improvement:.2f}x faster")
        print(f"  Time saved:            {avg_without - avg_with:.2f} ms per query")
        print("="*60)
        
        # Save results
        save_results(with_index_times, without_index_times)
        
        print("\n✓ Benchmark completed successfully!")
        print("\nYou can view the results in MongoDB Compass:")
        print("  Database: elibrary")
        print("  Collection: benchmarkResults")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()
